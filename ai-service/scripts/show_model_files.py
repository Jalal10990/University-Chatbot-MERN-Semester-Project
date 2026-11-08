"""Phase C, step 1: list the files of the model on the Hugging Face Hub with their sizes.
Nothing is downloaded by this script."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Read ai-service/.env BEFORE importing huggingface_hub, because the library
# reads HF_HOME (the cache folder) at import time.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from huggingface_hub import HfApi  # noqa: E402

MODEL_ID = os.getenv("LLM_MODEL_ID", "Qwen/Qwen3-0.6B")

info = HfApi().model_info(MODEL_ID, files_metadata=True)

total = 0
print(f"Model: {MODEL_ID}\n")
for item in sorted(info.siblings, key=lambda s: s.rfilename):
    size = item.size or 0
    total += size
    print(f"{size / 1024**2:10.1f} MB  {item.rfilename}")

print(f"\nTotal size of everything in the repository: {total / 1024**3:.2f} GB")
print("License tags:", [t for t in (info.tags or []) if t.startswith("license")])
print("Gated (needs approval):", info.gated)
print("HF_HOME (cache folder):", os.getenv("HF_HOME", "(not set - default C: location)"))