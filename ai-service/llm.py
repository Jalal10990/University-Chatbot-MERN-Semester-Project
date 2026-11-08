"""The local language model: Hugging Face Transformers + PyTorch (CPU), loaded ONCE at start-up."""
import logging
import os
import re
import threading
import time
from pathlib import Path

from dotenv import load_dotenv

# Settings live in ai-service/.env. Load them before any Hugging Face library is imported.
load_dotenv(Path(__file__).resolve().parent / ".env")
# Work offline: use only the model files already stored in HF_HOME. Never download during a request.
os.environ.setdefault("HF_HUB_OFFLINE", "1")

logger = logging.getLogger("uvicorn.error")   # messages appear in the uvicorn terminal

# The instruction that shapes every answer. A small model can still ignore it,
# which is why real university facts must come from documents in a later phase.
SYSTEM_PROMPT = (
    "You are a helpful assistant for university students. "
    "You do NOT have access to official university documents. "
    "Never state specific university facts such as fees, dates, deadlines, rules or contact details. "
    "If asked for them, say that you cannot verify that information and suggest contacting "
    "the relevant university office. You may use information the user told you earlier in this "
    "conversation, such as their name. Keep answers short and clear."
)


class LLMUnavailableError(Exception):
    """The model is switched off or failed to load."""


class LLMBusyError(Exception):
    """Too many requests are already waiting for the model."""


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    return default if value is None else value.strip().lower() in ("1", "true", "yes", "on")


def _clean(text: str) -> str:
    """Stop people typing the model's own control tokens (for example "<|im_start|>")."""
    return text.replace("<|", "< |")


def _remove_thinking(text: str) -> str:
    """Qwen3 can emit <think>...</think>. Users never see that part."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _trim_to_last_sentence(text: str) -> str:
    """If the answer was cut by the length limit, end it at the last full sentence."""
    ends = [m.end() for m in re.finditer(r"[.!?](?=\s|$)", text)]
    if ends and ends[-1] >= len(text) * 0.4:
        return text[: ends[-1]].strip()
    return text


class LocalLLM:
    def __init__(self) -> None:
        self.enabled = _read_bool("LLM_ENABLED", True)
        self.model_id = os.getenv("LLM_MODEL_ID", "Qwen/Qwen3-0.6B")
        self.dtype_name = os.getenv("LLM_DTYPE", "float32")
        self.max_new_tokens = int(os.getenv("LLM_MAX_NEW_TOKENS", "120"))
        self.max_pending = int(os.getenv("LLM_MAX_PENDING", "3"))   # 1 running + 2 waiting
        self.max_history = int(os.getenv("LLM_MAX_HISTORY", "6"))   # earlier messages given to the model
        self.tokenizer = None
        self.model = None
        self.error = None
        self._torch = None
        self._run_lock = threading.Lock()      # only ONE generation at a time
        self._count_lock = threading.Lock()
        self._pending = 0                      # requests running or waiting

    # ---------- start-up ----------
    def load(self) -> None:
        """Called once when the service starts. Never crashes the service."""
        if not self.enabled:
            logger.info("Language model is switched off (LLM_ENABLED=false): mock replies only.")
            return
        try:
            import torch  # imported here so a disabled model costs no start-up time
            from transformers import AutoModelForCausalLM, AutoTokenizer

            started = time.perf_counter()
            dtype = {"float32": torch.float32, "bfloat16": torch.bfloat16}[self.dtype_name]
            self._torch = torch
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
            self.model = AutoModelForCausalLM.from_pretrained(self.model_id, dtype=dtype)
            self.model.eval()
            logger.info("Language model loaded: %s (%s) in %.1f s",
                        self.model_id, self.dtype_name, time.perf_counter() - started)
        except Exception as error:   # noqa: BLE001 - keep the service alive and report clearly
            self.model = None
            self.tokenizer = None
            self.error = f"Could not load the language model ({type(error).__name__})."
            logger.exception("Language model loading failed")

    def status(self) -> dict:
        return {
            "enabled": self.enabled,
            "loaded": self.model is not None,
            "model_id": self.model_id,
            "dtype": self.dtype_name,
            "max_new_tokens": self.max_new_tokens,
            "max_history": self.max_history,
            "error": self.error,
        }

    # ---------- one request ----------
    def generate(self, message: str, history: list[dict] | None = None) -> str:
        if not self.enabled:
            raise LLMUnavailableError("The language model is switched off.")
        if self.model is None:
            raise LLMUnavailableError(self.error or "The language model is not loaded.")

        with self._count_lock:
            if self._pending >= self.max_pending:
                raise LLMBusyError()
            self._pending += 1
        try:
            with self._run_lock:     # other requests wait here for their turn
                return self._generate(message, history or [])
        finally:
            with self._count_lock:
                self._pending -= 1

    def _generate(self, message: str, history: list[dict]) -> str:
        torch = self._torch
        # Conversation = system instruction + earlier messages (oldest first) + the new question.
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for item in history[-self.max_history:]:
            if item.get("role") in ("user", "assistant"):
                messages.append({"role": item["role"], "content": _clean(item.get("content", ""))})
        messages.append({"role": "user", "content": _clean(message)})
        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True, enable_thinking=False
        )
        inputs = self.tokenizer(text, return_tensors="pt")
        prompt_tokens = inputs["input_ids"].shape[1]

        started = time.perf_counter()
        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=self.max_new_tokens,
                do_sample=True,
                temperature=0.7,
                top_p=0.8,
                top_k=20,
            )
        new_ids = output_ids[0, prompt_tokens:]
        answer = _remove_thinking(self.tokenizer.decode(new_ids, skip_special_tokens=True))

        cut_off = len(new_ids) >= self.max_new_tokens
        if cut_off:
            answer = _trim_to_last_sentence(answer)
        logger.info("Generated %d tokens in %.1f s%s", len(new_ids),
                    time.perf_counter() - started, " (hit the length limit)" if cut_off else "")

        if not answer:
            raise RuntimeError("The model produced an empty answer.")
        return answer