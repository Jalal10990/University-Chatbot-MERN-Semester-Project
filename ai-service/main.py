from typing import Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="University Chatbot AI Service")


# ---------- Data shapes (the "contract") ----------

class ChatRequest(BaseModel):
    # Remove spaces from the start/end BEFORE checking the length,
    # so a message made only of spaces is rejected.
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(min_length=1, max_length=1000)
    conversationId: Optional[str] = Field(default=None, max_length=100)


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


# ---------- Chat route ----------

# Spaces are placed at the START of each continued line, because editors
# can silently delete spaces at the END of a line when saving.
MOCK_ANSWER = (
    "Mock response: the AI service is running, but no university"
    " documents or language model are connected yet."
    " This is not an official answer."
)


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # DEVELOPMENT MOCK: no documents or language model are connected yet.
    # It never invents university policies and never returns fake sources.
    return ChatResponse(
        answer=MOCK_ANSWER,
        sources=[],
        status="ok",
        mode="mock",
    )