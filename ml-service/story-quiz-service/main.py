# ─────────────────────────────────────────────────────────────────────────
#  Story Quiz Service — standalone service used only to turn a family
#  memory story + its short family note into a 3-question recall quiz.
#  Separate from ml-service/memory-service/ (teammate-owned) and from the
#  Modal-hosted story-narrator (confirmed, via a live probe, to be the
#  wrong tool for structured quiz output — it truncates, returns answer
#  text instead of an index, and its hallucination-guard misfires on quiz
#  wording). Calls Groq's free hosted API instead of running a model
#  locally — same GROQ_BASE/model/retry pattern already proven working in
#  memory-service/remember_moments.py's _llm_json, just reimplemented here
#  rather than imported, since the two services are deliberately kept
#  independent. Switched away from a locally-hosted GGUF model (via
#  llama-cpp-python) because that needed more RAM than fits a free hosting
#  tier, and real on-device inference wasn't needed once a free, fast,
#  hosted option already existed in this same project.
# ─────────────────────────────────────────────────────────────────────────
import json
import os
import re
import time

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()  # reads ./.env into os.environ when running directly (uvicorn
# locally) — a no-op if the file doesn't exist, so Docker/Render deployments
# (which inject real env vars directly) are unaffected either way

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_FALLBACK_MODEL = os.environ.get("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
GROQ_BASE = "https://api.groq.com/openai/v1"

app = FastAPI()


# Calls Groq's chat completions endpoint, trying the primary model twice
# (JSON mode on, then off), then the smaller fallback model — same
# resilience order as memory-service's _llm_json, which was itself tuned
# against two failures seen in practice there: JSON-mode validation errors
# on some replies, and 429 rate limits (free tier). temperature stays above
# 0 (unlike memory-service's 0) because this service's own retry loop
# below depends on getting a genuinely different sample each attempt, not
# just error recovery.
def _call_groq(system_prompt: str, user_prompt: str) -> str | None:
    if not GROQ_API_KEY:
        return None

    attempts = [(GROQ_MODEL, True), (GROQ_MODEL, True), (GROQ_MODEL, False), (GROQ_FALLBACK_MODEL, False)]
    for model, strict in attempts:
        body = {
            "model": model,
            "temperature": 0.3,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_completion_tokens": 800,
        }
        if model.startswith("openai/gpt-oss"):
            body["reasoning_effort"] = "low"
        if strict:
            body["response_format"] = {"type": "json_object"}

        try:
            r = requests.post(
                f"{GROQ_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json=body,
                timeout=60,
            )
            if r.status_code == 429:
                wait = re.search(r"try again in ([\d.]+)s", r.text)
                time.sleep(min(40.0, float(wait.group(1)) + 1) if wait else 5)
                continue
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
        except Exception:
            continue

    return None


class GenerateQuizRequest(BaseModel):
    generated_story: str
    family_note: str = ""
    category: str = "other"
    patient_name: str = "them"
    num_questions: int = 3


SYSTEM_PROMPT = """You are generating a short memory recall quiz for a dementia patient, based on a family memory.
Use ONLY the facts in family_note below — do not invent people, places, dates, or occasions (e.g. do not assume
it's a wedding, birthday, or any specific event) unless family_note actually says so.

Write exactly 3 simple multiple-choice questions, one for each of these facts:
1. WHO - the person/relation this memory is about
2. WHERE - the place this happened
3. WHEN - the time this happened (season, year, "last summer", etc.) - if family_note doesn't mention a time, a reasonable guess is acceptable here only (not for WHO or WHERE)

Rules:
- Every single question MUST start with the exact words "Do you remember" - no exceptions. For example: "Do you remember where this happened?", "Do you remember whose wedding this was?", "Do you remember when this happened?". Never phrase a question any other way (e.g. never "Who is this about?" or "Where did this happen?" - always "Do you remember...").
- Each question is about ONE fact only. Keep it warm and simple, not clinical.
- Each question has exactly 3 answer choices: the correct one, plus 2 wrong ones of the SAME KIND (another relation, another nearby place, another time phrase). Never an unrelated wrong answer.
- "correct_answer" must be copied EXACTLY (character-for-character) from one of that question's "options" - never paraphrased or reworded.
- Every correct_answer must be a real fact actually stated in family_note - never invent or guess a fact that isn't there (except WHEN, as noted above).
- Output ONLY valid JSON, no greeting, no extra text before or after it. Do not say "Here are the questions" or similar - output must start with "{" and end with "}".

Respond in exactly this JSON structure. This is a WORKED EXAMPLE for an unrelated memory (a birthday party) - copy the STRUCTURE only, never this example's actual words, names, or places into your real answer:
{
  "success": true,
  "questions": [
    { "question": "Do you remember whose birthday this was?", "options": ["Your granddaughter's", "Your nephew's", "Your neighbor's"], "correct_answer": "Your granddaughter's", "source_snippet": "a photo from your granddaughter's birthday" },
    { "question": "Do you remember where the party was held?", "options": ["At the community hall", "At the beach", "At a restaurant"], "correct_answer": "At the community hall", "source_snippet": "the party at the community hall" },
    { "question": "Do you remember when this celebration happened?", "options": ["Last spring", "Last winter", "Two years ago"], "correct_answer": "Last spring", "source_snippet": "last spring's celebration" }
  ]
}"""


def build_user_prompt(req: GenerateQuizRequest) -> str:
    return (
        f'family_note: "{req.family_note}"\n'
        f'category: "{req.category}"\n'
        f'patient_name: "{req.patient_name}"\n'
        f'generated_story (backup context only, prefer family_note for facts): "{req.generated_story}"'
    )


_WORD_RE = re.compile(r"[a-zA-Z]{4,}")
# common function words that are 4+ letters but carry no real content —
# excluding these closes a real loophole found via live testing: "this year"
# was accepted as grounded in family_note only because the word "this"
# (not "year") happened to appear there, letting a hallucinated time slip through
_STOPWORDS = {
    "this", "that", "with", "from", "have", "your", "were", "when", "where",
    "what", "they", "them", "then", "than", "been", "about", "there", "here",
    "very", "some", "such", "into", "over", "also", "just", "much", "most",
}

# small 1.5B models are unreliable at tracking a numeric "correct_index"
# against options they just generated (confirmed via live testing — it
# regularly pointed at the wrong option despite passing every structural
# check). Asking for the correct answer as literal TEXT instead, then
# matching that text back to its position, is a much simpler task for a
# small model ("repeat which one you meant" vs. "track an index") and
# catches a wider class of failure.
def _find_option_index(correct_answer: str, options: list[str]):
    normalized_answer = correct_answer.strip().lower()
    for i, opt in enumerate(options):
        if opt.strip().lower() == normalized_answer:
            return i
    return None


# fact-check: the correct answer should actually be grounded in family_note
# (the family member's own short note) — reject the whole quiz if none of
# its significant words appear there. This is a heuristic, not a guarantee,
# but it catches the specific failure mode seen live: the model inventing
# an occasion (e.g. "wedding") that was never in family_note and then
# marking that invented detail as the correct answer.
_TIME_WORDS = {
    "summer", "winter", "spring", "autumn", "fall", "year", "years", "month",
    "months", "morning", "afternoon", "evening", "today", "yesterday",
    "week", "weeks",
}  # deliberately excludes generic words like "this"/"day"/"last"/"ago" —
# "this" in particular appears in nearly every family_note ("this your
# son..."), which was silently defeating the leniency check below entirely


def _is_time_guess(correct_answer: str) -> bool:
    words = {w.lower() for w in re.findall(r"[a-zA-Z]+", correct_answer)}
    return bool(words & _TIME_WORDS)


def _grounded_in_family_note(correct_answer: str, family_note: str, patient_name: str) -> bool:
    # family notes are written in second person ("your son", "we travelled") —
    # the patient's own name never literally appears there, so a correct WHO
    # answer that IS the patient would otherwise always be wrongly rejected.
    # Seen live: "Lashan Rashmika" correctly answered WHO but failed the word
    # check and took two good other questions down with it (all-or-nothing).
    if patient_name and correct_answer.strip().lower() in patient_name.strip().lower():
        return True

    note_lower = family_note.lower()
    note_words = {w.lower() for w in re.findall(r"[a-zA-Z]+", family_note)}

    # this model has a strong, confirmed-live bias toward guessing a season
    # ("last summer") as the WHEN answer even when explicitly told not to
    # invent one and to ask about something else instead — it doesn't
    # follow that instruction reliably. WHO/WHERE are always strictly
    # grounded (getting a person or place wrong is genuinely confusing for
    # a dementia patient); a wrong season guess is comparatively low-stakes,
    # so when family_note has NO time words at all to check against, a
    # time-shaped answer is allowed through rather than rejected outright —
    # there's no real fact being contradicted, just an unverifiable guess.
    if _is_time_guess(correct_answer) and not (note_words & _TIME_WORDS):
        return True

    words = [w for w in _WORD_RE.findall(correct_answer) if w.lower() not in _STOPWORDS]
    if not words:
        return True  # nothing substantial to check (e.g. a short option like "yes") — don't block it
    return any(w.lower() in note_lower for w in words)


MIN_VALID_QUESTIONS = 3  # require all 3 — a 2-question quiz is a much
# noisier memory-recall signal (random guessing alone gets 2-of-2 right on
# 3-option questions 1-in-9 times, vs 1-in-27 for 3-of-3), so the fix for a
# weak single question is retrying generation (see GENERATE_RETRIES below),
# not lowering how many count as "enough".
GENERATE_RETRIES = 3

# a single question's own validity — used to decide whether to KEEP it,
# not whether to reject the whole quiz (that decision is made once, after
# checking all 3, based on how many survived)
def _is_valid_question(q) -> bool:
    if not isinstance(q, dict):
        return False
    if not isinstance(q.get("question"), str) or not q["question"].strip():
        return False
    # enforced, not just requested — confirmed live that the model doesn't
    # reliably follow the warm-phrasing instruction on its own (often
    # reverting to "Who is this about?"/"Where did this happen?" instead of
    # "Do you remember..."), so this is now a hard gate rather than a prompt
    # suggestion the model is free to ignore.
    question_text = q["question"].strip()
    if not question_text.lower().startswith("do you remember"):
        return False
    # the question must have real content after "do you remember" — rejects
    # the literal template placeholder "Do you remember...?" the model
    # copied verbatim from the prompt's worked example in live testing
    after_prefix = question_text[len("do you remember"):].strip(" ?.")
    if len(after_prefix) < 5:
        return False
    options = q.get("options")
    if not isinstance(options, list) or len(options) != 3:
        return False
    if not all(isinstance(o, str) and o.strip() for o in options):
        return False
    normalized = [o.strip().lower() for o in options]
    if len(set(normalized)) != len(normalized):
        return False  # duplicate options — seen live
    # reject options that are just the question words themselves (seen
    # live: options literally ["who", "where", "when"]) — these can slip
    # past the grounding check because they're either too short to check
    # or happen to be in the stopword list
    if any(n in {"who", "what", "where", "when", "why", "how"} for n in normalized):
        return False
    correct_answer = q.get("correct_answer")
    if not isinstance(correct_answer, str) or not correct_answer.strip():
        return False
    return True


def _convert_question(q, family_note: str, patient_name: str):
    options = q["options"]
    correct_answer = q["correct_answer"]
    correct_index = _find_option_index(correct_answer, options)
    if correct_index is None:
        return None  # model didn't copy one of its own options exactly
    if not _grounded_in_family_note(correct_answer, family_note, patient_name):
        return None  # likely a hallucinated fact — seen live with invented "wedding" occasions
    return {
        "question": q["question"].strip(),
        "options": [o.strip() for o in options],
        "correct_index": correct_index,
        "source_snippet": q.get("source_snippet", "") if isinstance(q.get("source_snippet"), str) else "",
    }


# first-pass extraction/validation on the Python side — belt-and-suspenders
# ahead of Node's own validator, which stays the final authority (and also
# enforces this same MIN_VALID_QUESTIONS floor).
#
# Confirmed live: requiring all 3 questions to pass meant one weak question
# (usually WHEN, when family_note has no real time reference) threw away two
# otherwise-good ones, making most attempts fail outright. Each question is
# now validated independently; the quiz is kept if at least
# MIN_VALID_QUESTIONS of the 3 pass — a bad individual question is dropped,
# not treated as poisoning the whole response.
def extract_and_validate(raw_text: str, family_note: str, patient_name: str):
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        data = json.loads(raw_text[start:end + 1])
    except json.JSONDecodeError:
        return None

    questions = data.get("questions")
    if not isinstance(questions, list) or len(questions) < MIN_VALID_QUESTIONS:
        return None  # too structurally broken to salvage anything

    converted = []
    for q in questions:
        if not _is_valid_question(q):
            continue
        result = _convert_question(q, family_note, patient_name)
        if result is not None:
            converted.append(result)

    if len(converted) < MIN_VALID_QUESTIONS:
        return None

    return {"success": True, "questions": converted}


@app.post("/generate-quiz")
def generate_quiz(req: GenerateQuizRequest):
    # a single generation attempt only has a moderate chance of landing a
    # clean 3-of-3 (confirmed live: roughly half the time) — retrying a
    # few times, each a fresh stochastic sample, is far more likely to find
    # one than accepting a weaker partial result would be.
    for attempt in range(GENERATE_RETRIES):
        raw_text = _call_groq(SYSTEM_PROMPT, build_user_prompt(req))
        if raw_text is None:
            continue  # transient Groq failure this attempt — try again

        validated = extract_and_validate(raw_text, req.family_note, req.patient_name)
        if validated is not None:
            return validated

    return {"success": False, "questions": []}


@app.get("/health")
def health():
    return {"success": True, "groqConfigured": bool(GROQ_API_KEY)}
