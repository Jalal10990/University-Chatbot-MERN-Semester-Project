"""Phase D: test the local model on its own (no FastAPI, no Node.js involved).

Run from the ai-service folder:
    python scripts\\test_model.py
    python scripts\\test_model.py --dtype bfloat16
    python scripts\\test_model.py --prompt "How do I write a polite email to my teacher?"
"""
import argparse
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

# 1) Read ai-service/.env first (it holds HF_HOME and LLM_MODEL_ID).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
# 2) Work OFFLINE: use only the files already downloaded to D:. Must be set before the imports below.
os.environ.setdefault("HF_HUB_OFFLINE", "1")

import torch  # noqa: E402
from transformers import AutoModelForCausalLM, AutoTokenizer  # noqa: E402

try:
    import psutil  # optional: only used to measure memory
except ImportError:
    psutil = None

# The instruction that tells the model how to behave. We will refine it in Phase E.
SYSTEM_PROMPT = (
    "You are a helpful assistant for university students. "
    "You do NOT have access to official university documents. "
    "Never state specific university facts such as fees, dates, deadlines, rules or contact details. "
    "If asked for them, say that you cannot verify that information and suggest contacting "
    "the relevant university office. Keep answers short and clear."
)

TEST_PROMPTS = [
    "What is the admission fee at the university?",
    "How do I write a polite email to my teacher to ask for more time on an assignment?",
    "Hi",
]


def gb(num_bytes: float) -> float:
    return num_bytes / 1024**3


def memory_now() -> str:
    if psutil is None:
        return "n/a (install psutil, or watch Task Manager)"
    return f"{gb(psutil.Process().memory_info().rss):.2f} GB used by this program"


def free_ram() -> str:
    if psutil is None:
        return "n/a"
    return f"{gb(psutil.virtual_memory().available):.2f} GB"


def remove_thinking(text: str) -> str:
    """Qwen3 can emit <think>...</think>. We never show that part to users."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dtype", choices=["float32", "bfloat16"], default="float32")
    parser.add_argument("--max-new-tokens", type=int, default=80)
    parser.add_argument("--prompt", default=None)
    parser.add_argument("--threads", type=int, default=None)
    args = parser.parse_args()

    model_id = os.getenv("LLM_MODEL_ID", "Qwen/Qwen3-0.6B")
    dtype = {"float32": torch.float32, "bfloat16": torch.bfloat16}[args.dtype]
    if args.threads:
        torch.set_num_threads(args.threads)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Model:   {model_id}")
    print(f"Device:  {device}   (CPU threads: {torch.get_num_threads()})")
    print(f"Precision: {args.dtype}")
    print(f"Free RAM before loading: {free_ram()}\n")

    # ---------------- 1. Tokenizer ----------------
    print("=== 1. Tokenizer ===")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    sample = "What is the admission fee?"
    ids = tokenizer(sample)["input_ids"]
    print("Text:  ", sample)
    print("IDs:   ", ids)
    print("Pieces:", tokenizer.convert_ids_to_tokens(ids))

    # ---------------- 2. Load the model ----------------
    print("\n=== 2. Loading the model (this is the slow, one-time part) ===")
    start = time.perf_counter()
    model = AutoModelForCausalLM.from_pretrained(model_id, dtype=dtype)
    model.to(device)
    model.eval()  # inference mode: no training behaviour
    load_seconds = time.perf_counter() - start
    parameters = sum(p.numel() for p in model.parameters())
    print(f"Loaded in {load_seconds:.1f} s | parameters: {parameters / 1e6:.0f} million")
    print(f"Memory after loading: {memory_now()}\n")

    # ---------------- 3. Generate ----------------
    print("=== 3. Generating answers ===")
    prompts = [args.prompt] if args.prompt else TEST_PROMPTS
    speeds = []
    for question in prompts:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ]
        # Put the conversation into the exact format the model was trained on.
        # enable_thinking=False switches off Qwen3's long hidden reasoning (too slow on CPU).
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True, enable_thinking=False
        )
        inputs = tokenizer(text, return_tensors="pt").to(device)
        prompt_tokens = inputs["input_ids"].shape[1]

        start = time.perf_counter()
        with torch.inference_mode():  # no gradients: faster and uses less memory
            output_ids = model.generate(
                **inputs,
                max_new_tokens=args.max_new_tokens,
                do_sample=True,   # pick the next token randomly, weighted by probability
                temperature=0.7,  # values from Qwen's advice for non-thinking mode
                top_p=0.8,
                top_k=20,
            )
        seconds = time.perf_counter() - start

        new_ids = output_ids[0, prompt_tokens:]       # drop the prompt, keep only new tokens
        answer = remove_thinking(tokenizer.decode(new_ids, skip_special_tokens=True))
        generated = len(new_ids)
        speed = generated / seconds if seconds > 0 else 0.0
        speeds.append(speed)

        print(f"\nQ: {question}")
        print(f"A: {answer}")
        cut = "  (CUT OFF: hit the length limit)" if generated >= args.max_new_tokens else ""
        print(f"   [{prompt_tokens} prompt tokens in, {generated} tokens out, "
              f"{seconds:.1f} s, {speed:.2f} tokens/s]{cut}")

    # ---------------- Summary ----------------
    print("\n=== Summary ===")
    print(f"Precision: {args.dtype} | load time: {load_seconds:.1f} s")
    print(f"Memory now: {memory_now()}")
    if psutil is not None:
        peak = getattr(psutil.Process().memory_info(), "peak_wset", None)
        if peak:
            print(f"Peak memory: {gb(peak):.2f} GB")
    print(f"Average speed: {sum(speeds) / len(speeds):.2f} tokens/s")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except MemoryError:
        print("\nERROR: out of memory. Close other programs (browser, servers) and try again, "
              "or use --dtype bfloat16.")
    except OSError as error:
        print(f"\nERROR: a file problem: {error}")
        print("If the model files are missing, run:  python scripts\\download_model.py")
    except RuntimeError as error:
        text = str(error)
        if "allocate" in text.lower() or "out of memory" in text.lower():
            print("\nERROR: not enough free memory. Close other programs and retry, "
                  "or use --dtype bfloat16.")
        print(f"\nRuntimeError: {text}")
    except Exception as error:  # noqa: BLE001 - show anything unexpected clearly
        print(f"\nUNEXPECTED ERROR ({type(error).__name__}): {error}")
    sys.exit(1) 