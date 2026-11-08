"""Phase C, step 2: download the model files into the cache folder (HF_HOME)."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")   # must come BEFORE the import below

from huggingface_hub import snapshot_download  # noqa: E402

MODEL_ID = os.getenv("LLM_MODEL_ID", "Qwen/Qwen3-0.6B")

print(f"Downloading {MODEL_ID} ...")
print("Cache folder:", os.getenv("HF_HOME", "(not set - default C: location)"))

# Downloads every file of the model once. If a download is interrupted,
# running this script again resumes instead of starting from zero.
folder = snapshot_download(repo_id=MODEL_ID)

print("\nDone. Model files are in:")
print(folder)
for name in sorted(os.listdir(folder)):
    print("  ", name)