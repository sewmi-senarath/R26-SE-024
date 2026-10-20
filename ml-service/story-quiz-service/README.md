# Story Quiz Service

Standalone, local, free microservice that turns a family memory story + its
short family note into a 3-question recall quiz for the patient. Runs a
small quantized instruct model (Qwen2.5-1.5B-Instruct, Q4_K_M GGUF) via
`llama-cpp-python`, CPU-only — no GPU, no paid API, no internet access at
runtime (only once, during setup, to download the model file).

This is separate from `ml-service/memory-service/` (a different, unrelated
Python service) and from the Modal-hosted story-narrator (used only for
turning a photo + note into the narrated story the patient hears — a
different model better suited to that job).

## Setup (one-time)

```
pip install -r requirements.txt
python download_model.py
```

This downloads `qwen2.5-1.5b-instruct-q4_k_m.gguf` (~1.0GB) into `./models/`.

## Run

```
uvicorn main:app --port 5003
```

Started manually in its own terminal, same as the other Python services in
this project (`ml-service/caregiver`, `ml-service/dementia`,
`ml-service/memory-service`) — there's no root-level process orchestration
for any of them.

## Backend wiring

`backend/src/services/family/storyQuizService.js` calls this service at
`QUIZ_ML_URL` (env var, defaults to `http://localhost:5003`) instead of the
Modal AI service for `/generate-quiz`. If this service isn't running, or
returns something invalid, the backend falls back to showing no quiz for
that session rather than erroring — see that file for the exact contract.
