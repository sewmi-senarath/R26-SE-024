# One-time setup script — downloads the quantized GGUF model file used by
# main.py. Run this once after `pip install -r requirements.txt`, before
# starting the service. Needs network access only this one time; the
# service itself never calls out to the internet at runtime.
from huggingface_hub import hf_hub_download

REPO_ID = "Qwen/Qwen2.5-1.5B-Instruct-GGUF"
FILENAME = "qwen2.5-1.5b-instruct-q4_k_m.gguf"

if __name__ == "__main__":
    path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME, local_dir="./models")
    print(f"Model downloaded to: {path}")
