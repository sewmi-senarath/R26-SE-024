# MemoCare memory service (FastAPI, port 8000)
FROM python:3.11-slim

# ffmpeg: video diary + audio; libgl/glib: OpenCV; chromium + Noto fonts: Sinhala cards in the video diary
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg libgl1 libglib2.0-0 chromium fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
# CPU-only PyTorch first (the default GPU build is several GB larger)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# CLIP for YOLO-World (the extra-items prompts); installed from git, so git first.
# A separate last layer, so changing it does not re-download PyTorch above.
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir git+https://github.com/ultralytics/CLIP.git

COPY . .
ENV CHROME_PATH=/usr/bin/chromium \
    PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
