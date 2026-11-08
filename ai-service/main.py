import logging
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from llm import LLMBusyError, LLMUnavailableError, LocalLLM

logger = logging.getLogger("uvicorn.error")

llm = LocalLLM()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs ONCE when the service starts: load the model into memory.
    llm.load()
    yield


app = FastAPI(title="University Chatbot AI Service", lifespan=lifespan)


# ---------- Data shapes (the "contract") ----------

class HistoryMessage(BaseModel):
    """One earlier message of the same conversation (sent by the Node backend)."""
    role: Literal["user", "assistant"]
    content: str = Field(max_length=1000)


class ChatRequest(BaseModel):
    # Remove spaces from the start/end BEFORE checking the length,
    # so a message made only of spaces is rejected.
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(min_length=1, max_length=1000)
    conversationId: Optional[str] = Field(default=None, max_length=100)
    # Optional: requests without history still work exactly as before.
    history: list[HistoryMessage] = Field(default_factory=list, max_length=20)


class Source(BaseModel):
    title: str
    page: Optional[int] = None
    snippet: str = ""
    url: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    status: Literal["ok", "insufficient_evidence"]
    mode: Literal["mock", "ai"]


# ---------- Existing routes (unchanged) ----------

@app.get("/")
def root():
    return {
        "message": "University Chatbot AI service is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-service"
    }


# ---------- New: model status (for you, while developing) ----------

@app.get("/health/llm")
def health_llm():
    return llm.status()


# ---------- Chat route ----------

# Used only when LLM_ENABLED=false. Spaces are at the START of continued lines on purpose.
MOCK_ANSWER = (
    "Mock response: the AI service is running, but no university"
    " documents or language model are connected yet."
    " This is not an official answer."
)


# A plain "def" (not "async def"): FastAPI runs it in a worker thread, so the long
# generation does not freeze the server's event loop.
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not llm.enabled:
        return ChatResponse(answer=MOCK_ANSWER, sources=[], status="ok", mode="mock")

    try:
        answer = llm.generate(request.message, [m.model_dump() for m in request.history])
    except LLMBusyError:
        raise HTTPException(status_code=503, detail="The language model is busy. Please try again in a moment.")
    except LLMUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except Exception:  # noqa: BLE001 - log details here, show a safe message to the caller
        logger.exception("Answer generation failed")
        raise HTTPException(status_code=500, detail="The language model failed to generate an answer.")

    # sources stays EMPTY: a general model has no official documents to cite. We never invent any.
    return ChatResponse(answer=answer, sources=[], status="ok", mode="ai")