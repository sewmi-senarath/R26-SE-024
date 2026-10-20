# Story recall quiz generator (FastAPI) — calls Groq's hosted API instead
# of running a model locally, so this image is intentionally tiny: no
# model file to bake in, no compiled dependencies. Deployed as its own
# Render web service, same pattern as the caregiver/dementia ML services.
# Render assigns its own port at runtime via $PORT, so the service binds
# to that instead of a hardcoded port (defaults to 5003 for local/Docker
# Compose use, where no PORT variable is set).
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=5003
EXPOSE 5003
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
