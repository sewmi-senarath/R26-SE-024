# -*- coding: utf-8 -*-
"""
Remember-moments: the "engagement-triggered" memory capture flow.

Instead of saving every camera frame (impractical - the panel's main criticism),
the app streams frames here for detection only (/detect-live). Nothing is stored
permanently until the patient has engaged with the same scene for ~30 seconds;
the app then calls /save-moment, which keeps only the best few frames of that
moment plus what was in them, where (GPS + inferred room) and when.

Adaptive personalization (online few-shot learning, no weight retraining):
every confirmed meeting adds that face's embedding to the person's gallery, and
every saved moment adds the object's crop embedding to that object's gallery,
so recognition of *this* patient's people and things improves with each day of
use. Retraining network weights per patient daily isn't practical (GPU, labels,
catastrophic forgetting); growing a per-patient prototype gallery is.

Also covers: finding a thing by voice, Sinhala text-to-speech / speech-to-text,
daily interaction time, and the end-of-day memory story (auto-written at
STORY_HOUR by a background thread).
"""
import os
import io
import json
import uuid
import math
import hashlib
import sltime as datetime  # Sri Lanka time whatever the host timezone (see sltime.py)
import threading
from collections import deque

import numpy as np
import requests
import cloudinary.uploader
from PIL import Image, ImageOps
from gtts import gTTS
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from ultralytics import YOLO

router = APIRouter()
_ctx = {}


def init(**kwargs):
    """Called once from main.py with shared objects (COCO model, face-embedding
    function, diary logger) so this module doesn't import main (circular)."""
    _ctx.update(kwargs)
    # Load both detectors onto the GPU now, in the background - otherwise the
    # very first live frame after a restart waits ~10s for model loading.
    threading.Thread(target=_warm_up, daemon=True, name="model-warm-up").start()


def _warm_up():
    try:
        _detect(Image.new("RGB", (640, 480), (128, 128, 128)))
        print("[remember_moments] detectors warmed up")
    except Exception as e:
        print("warm-up failed (first request will be slower):", e)
    try:
        _heal_face_galleries()
    except Exception as e:
        print("face gallery check failed:", e)


def _heal_face_galleries():
    """One-off upgrade for people registered before enrolment anchors existed: their
    gallery may hold views the old, looser learning step took from look-alikes."""
    if not _ctx.get("facenet_ok"):
        return
    changed = {}
    for pid, people in PEOPLE.items():
        todo = [p for p in people if p.get("embeddings") and not p.get("anchors")]
        if not todo:
            continue
        for p in todo:
            changed[f"{pid[:8]}/{p['id']}"] = _rebuild_anchors(p)
        for p in todo:
            for q in people:
                if q is not p and q.get("embeddings"):
                    changed[f"{pid[:8]}/{p['id']}"] += _drop_views_closer_to(p, q)
    if changed:
        _save()
        print("[remember_moments] face galleries anchored, views removed:", changed)


GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_BASE = "https://api.groq.com/openai/v1"

DB_FILE = "moments_db.json"
TTS_DIR = "tts_cache"
os.makedirs(TTS_DIR, exist_ok=True)

MOMENTS = {}         # pid -> [moment]
LAST_SEEN = {}       # pid -> {label: {...latest sighting...}}
PEOPLE = {}          # pid -> [{id, name, relation, relation_si, embeddings: [[...]], photo_url, created, last_seen}]
OBJECT_GALLERY = {}  # pid -> {label: [embedding, ...]}  - this patient's own cup, glasses, ...
PATIENT_NAMES = {}   # pid -> first name, so another resident's things can be named ("Kamala's keys")
INTERACTIONS = {}    # pid -> {date: {key: {kind, ref, name_si, seconds, count}}}
STORIES = {}         # pid -> {date: {lang: {title, story, photos, people, created, auto}}}
CAREGIVER_PINS = {}  # pid -> sha256(pin) - gates family registration / approvals
FAMILY_ALERTS = {}   # pid -> [{id, kind, claimed, photo_url, said, time, seen}]
FIND_LOG = {}        # pid -> [{time, label, found, q}] - every "where is my ...?" (a forgetting signal)

STORY_HOUR = int(os.environ.get("STORY_HOUR", "20"))
FACE_MATCH = 0.65        # FaceNet cosine - same threshold the face-login flow uses
FACE_MAYBE = 0.50        # between MAYBE and MATCH: ask, but merge if the answer agrees
FACE_NEW_VIEW = 0.92     # below this a confident match is a genuinely new view - worth keeping
# Family greeting is stricter than face login: a wrong "this is your grandson"
# confuses the patient, an "I'm not sure, who is this?" does not.
FAMILY_MATCH = 0.72      # greet only above this ...
FAMILY_MARGIN = 0.08     # ... and only when clearly closer than the next family member
FAMILY_LEARN = 0.80      # learn a new view only this sure (a wrong learned view drifts the gallery)
ANCHOR_AGREE = 0.60      # a match / learned view must also agree with the caregiver's enrolment photos
FAMILY_VERIFY = 0.60     # a spoken "I'm his son" is accepted only with this face similarity
FACE_MIN_PX = 60         # enrolment photo: face at least this wide
LIVE_FACE_MIN_PX = 48    # live camera: smaller faces are too unreliable to name
BLUR_MIN, LIVE_BLUR_MIN = 30.0, 15.0   # Laplacian variance of the 160px face crop
OBJECT_FAMILIAR = 0.80   # MobileNet cosine for "this is your usual cup"
GALLERY_CAP = 15

# Short-lived, in-memory only: the last few live frames per patient, so a save
# or a "who is this?" check can reuse what was already uploaded for detection.
LIVE_FRAMES = {}     # pid -> deque[{jpeg, detections, time}]
LAST_CLIENT = {}     # pid -> epoch seconds of the last /detect-live call from the app
PENDING_FACES = {}   # pending_id -> {pid, embedding, photo_url, created}
_lock = threading.Lock()
# YOLO / FaceNet objects aren't safe to call from two threads at once, and the
# ESP32 passive worker runs alongside the request handlers.
INFER_LOCK = threading.RLock()


def _load():
    global MOMENTS, LAST_SEEN, PEOPLE, OBJECT_GALLERY, INTERACTIONS, STORIES, CAREGIVER_PINS, FAMILY_ALERTS, FIND_LOG
    global PATIENT_NAMES
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            MOMENTS = data.get("MOMENTS", {})
            LAST_SEEN = data.get("LAST_SEEN", {})
            PEOPLE = data.get("PEOPLE", {})
            OBJECT_GALLERY = data.get("OBJECT_GALLERY", {})
            INTERACTIONS = data.get("INTERACTIONS", {})
            STORIES = data.get("STORIES", {})
            CAREGIVER_PINS = data.get("CAREGIVER_PINS", {})
            FAMILY_ALERTS = data.get("FAMILY_ALERTS", {})
            FIND_LOG = data.get("FIND_LOG", {})
            PATIENT_NAMES = data.get("PATIENT_NAMES", {})
        except Exception as e:
            print("moments_db load failed:", e)
    # Older records stored a single "embedding" - move it into the gallery.
    for plist in PEOPLE.values():
        for p in plist:
            if "embeddings" not in p:
                p["embeddings"] = [p.pop("embedding")] if p.get("embedding") else []


def _save():
    with _lock:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump({"MOMENTS": MOMENTS, "LAST_SEEN": LAST_SEEN, "PEOPLE": PEOPLE,
                       "OBJECT_GALLERY": OBJECT_GALLERY, "INTERACTIONS": INTERACTIONS,
                       "STORIES": STORIES, "CAREGIVER_PINS": CAREGIVER_PINS,
                       "FAMILY_ALERTS": FAMILY_ALERTS, "FIND_LOG": FIND_LOG,
                       "PATIENT_NAMES": PATIENT_NAMES}, f, ensure_ascii=False)


def _today():
    return datetime.date.today().isoformat()


def _add_interaction(pid, kind, ref, name_si, seconds):
    day = INTERACTIONS.setdefault(pid, {}).setdefault(_today(), {})
    key = f"{kind}:{ref}"
    rec = day.setdefault(key, {"kind": kind, "ref": ref, "name_si": name_si, "seconds": 0, "count": 0})
    rec["seconds"] += max(0, int(seconds))
    rec["count"] += 1
    rec["name_si"] = name_si or rec["name_si"]
    # When it happened - the memory game asks "morning or evening?" and "what came first?"
    now = datetime.datetime.now().isoformat()
    rec.setdefault("first", now)
    rec["last"] = now


_load()

# ─── Vocabulary ──────────────────────────────────────────────────────────────
SI_NAMES = {
    "person": "පුද්ගලයා", "cup": "කෝප්පය", "bottle": "බෝතලය", "cell phone": "ෆෝන් එක",
    "remote": "රිමෝට් එක", "book": "පොත", "laptop": "ලැප්ටොප් එක", "mouse": "මවුස් එක",
    "keyboard": "කීබෝඩ් එක", "chair": "පුටුව", "couch": "සෝෆාව", "bed": "ඇඳ",
    "dining table": "කෑම මේසය", "tv": "ටීවී එක", "clock": "ඔරලෝසුව", "vase": "මල් බඳුන",
    "scissors": "කතුර", "toothbrush": "දත් බුරුසුව", "bowl": "බඳුන", "spoon": "හැන්ද",
    "fork": "ගෑරුප්පුව", "knife": "පිහිය", "handbag": "අත් බෑගය", "backpack": "බෑගය",
    "umbrella": "කුඩය", "potted plant": "පැළ බඳුන", "oven": "උදුන", "refrigerator": "ශීතකරණය",
    "sink": "සින්ක් එක", "microwave": "මයික්‍රෝවේව් එක", "wine glass": "වීදුරුව",
    "banana": "කෙසෙල්", "apple": "ඇපල්", "orange": "දොඩම්", "teddy bear": "ටෙඩි බෝලය",
    "suitcase": "ගමන් මල්ල", "toilet": "වැසිකිළිය", "hair drier": "හෙයාර් ඩ්‍රයර් එක",
    "dog": "බල්ලා", "cat": "පූසා", "sports ball": "බෝලය", "cake": "කේක්",
    "glasses": "කණ්ණාඩිය", "keys": "යතුරු", "wallet": "පසුම්බිය", "pill bottle": "බෙහෙත් බෝතලය",
    "hearing aid": "ශ්‍රවණාධාරය", "watch": "අත් ඔරලෝසුව", "drinking glass": "වීදුරුව",
    "plate": "පිඟාන", "kettle": "කේතලය",
    "fan": "විදුලි පංකාව", "slippers": "සෙරෙප්පු", "walking stick": "සැරයටිය", "towel": "තුවාය",
    "comb": "පනාව", "flask": "ෆ්ලාස්ක් එක", "charger": "චාජර් එක", "hat": "තොප්පිය",
    "torch": "ටෝච් එක", "pen": "පෑන",
}

# Things a patient can't "lose" - they're never offered in Find-by-voice, but they
# are kept as location anchors ("your cup was near the sink") and used to guess
# the room, which GPS can't resolve indoors.
FIXED_ANCHORS = {"sink", "oven", "refrigerator", "microwave", "bed", "couch", "toilet",
                 "dining table", "tv", "chair", "potted plant", "fan"}
ROOM_FROM_ANCHOR = {
    "sink": ("Kitchen", "කුස්සිය"), "oven": ("Kitchen", "කුස්සිය"),
    "refrigerator": ("Kitchen", "කුස්සිය"), "microwave": ("Kitchen", "කුස්සිය"),
    "bed": ("Bedroom", "නිදන කාමරය"), "toilet": ("Bathroom", "නාන කාමරය"),
    "couch": ("Living room", "සාලය"), "tv": ("Living room", "සාලය"),
    "dining table": ("Dining room", "කෑම කාමරය"),
}
ROOM_SI = {"Kitchen": "කුස්සිය", "Bedroom": "නිදන කාමරය", "Bathroom": "නාන කාමරය",
           "Living room": "සාලය", "Dining room": "කෑම කාමරය", "Hallway": "ඉස්තෝප්පුව",
           "Outside": "එළිය"}

# Personal items that COCO's 80 classes don't have - found with YOLO-World instead.
# Prompt wording matters: "glasses" alone fired on drinking glasses, and "keys"
# never fired on real key photos in any phrasing tried (keys, house key, metal
# key, key fob, key ring at 640/1024px), so keys are left out rather than guessed.
PERSONAL_VOCAB = ["eyeglasses", "wallet", "pill bottle", "hearing aid", "wristwatch", "drinking glass"]
WORLD_TO_LABEL = {"eyeglasses": "glasses", "wristwatch": "watch"}

# Essential things the fine-tuned items model does not know yet. While it is in
# use, YOLO-World looks for these in the same frame. Only prompts that held up on
# test photos are kept: "shoes" found slippers (0.77), "thermos flask" a flask
# (0.71), "hat" a hat. Fan, towel, bag and walking stick scored under 0.25 with
# every wording tried, so they come from retraining the items model instead
# (Open Images has Mechanical/Ceiling fan, Towel, Handbag, Backpack, Footwear ...).
EXTRA_VOCAB = ["shoes", "thermos flask", "hat"]
EXTRA_TO_LABEL = {"shoes": "slippers", "thermos flask": "flask"}
EXTRA_CONF = float(os.environ.get("EXTRA_CONF", "0.35"))
# Known mix-ups of the first items model: brown leather slippers came out as a
# "wallet" (0.93). When YOLO-World is fairly sure of the other label for the
# same box, that label wins even though its score is lower.
EXTRA_OVERRIDES = {("slippers", "wallet"): 0.6}

# Sinhala/English words people actually say -> canonical label.
SPOKEN_TO_LABEL = {
    "කෝප්ප": "cup", "කප්": "cup", "cup": "cup", "මග්": "cup",
    "බෝතල": "bottle", "bottle": "bottle", "වතුර බෝතල": "bottle",
    "ෆෝන්": "cell phone", "දුරකථන": "cell phone", "phone": "cell phone", "මොබයිල්": "cell phone",
    "රිමෝට්": "remote", "remote": "remote", "පොත": "book", "book": "book",
    "කණ්ණාඩි": "glasses", "කන්නාඩි": "glasses", "glasses": "glasses", "spectacles": "glasses",
    "යතුර": "keys", "key": "keys", "පර්ස්": "wallet", "පසුම්බි": "wallet", "wallet": "wallet",
    "බෙහෙත්": "pill bottle", "pill": "pill bottle", "medicine": "pill bottle",
    "ලැප්ටොප්": "laptop", "laptop": "laptop", "කුඩ": "umbrella", "umbrella": "umbrella",
    "බෑග්": "handbag", "bag": "handbag", "ඔරලෝසු": "watch", "watch": "watch",
    "කතුර": "scissors", "scissors": "scissors", "දත් බුරුසු": "toothbrush", "toothbrush": "toothbrush",
    "බඳුන": "bowl", "bowl": "bowl", "වීදුරු": "drinking glass", "glass": "drinking glass",
    "මල් බඳුන": "vase", "vase": "vase", "ශ්‍රවණ": "hearing aid",
    "පංකාව": "fan", "fan": "fan", "සෙරෙප්පු": "slippers", "slippers": "slippers", "සපත්තු": "slippers",
    "සැරයටිය": "walking stick", "walking stick": "walking stick", "තුවාය": "towel", "towel": "towel",
    "පනාව": "comb", "comb": "comb", "ෆ්ලාස්ක්": "flask", "flask": "flask", "චාජර්": "charger",
    "charger": "charger", "තොප්පිය": "hat", "hat": "hat", "ටෝච්": "torch", "torch": "torch",
    "පෑන": "pen", "pen": "pen",
}

RELATIONS = {
    "පුතා": ("son", "පුතා"), "දුව": ("daughter", "දුව"), "දියණිය": ("daughter", "දුව"),
    "බිරිඳ": ("wife", "බිරිඳ"), "නෝනා": ("wife", "බිරිඳ"), "සැමියා": ("husband", "සැමියා"),
    "මහත්තයා": ("husband", "සැමියා"), "අම්මා": ("mother", "අම්මා"), "තාත්තා": ("father", "තාත්තා"),
    "අයියා": ("elder brother", "අයියා"), "මල්ලි": ("younger brother", "මල්ලි"),
    "අක්කා": ("elder sister", "අක්කා"), "නංගි": ("younger sister", "නංගි"),
    "මුණුබුරා": ("grandson", "මුණුබුරා"), "මිනිබිරිය": ("granddaughter", "මිනිබිරිය"),
    "යාළුවා": ("friend", "යාළුවා"), "යාලුවා": ("friend", "යාළුවා"), "මිතුරා": ("friend", "යාළුවා"),
    "හෙදිය": ("nurse", "හෙදිය"), "දොස්තර": ("doctor", "දොස්තර"), "වෛද්‍ය": ("doctor", "දොස්තර"),
    "son": ("son", "පුතා"), "daughter": ("daughter", "දුව"), "wife": ("wife", "බිරිඳ"),
    "husband": ("husband", "සැමියා"), "friend": ("friend", "යාළුවා"), "nurse": ("nurse", "හෙදිය"),
    "doctor": ("doctor", "දොස්තර"), "mother": ("mother", "අම්මා"), "father": ("father", "තාත්තා"),
}


# ─── Never show Hindi letters ───────────────────────────────────────────────
# Whisper writes Sinhala speech phonetically in Devanagari (see /transcribe).
# That is only an internal step: anything shown to a patient, caregiver or
# doctor is converted to Sinhala script. Both scripts are Brahmic, so a letter
# map gives a readable Sinhala spelling even when the LLM is not available.
_DEVA_TO_SI = {
    "अ": "අ", "आ": "ආ", "इ": "ඉ", "ई": "ඊ", "उ": "උ", "ऊ": "ඌ", "ऋ": "ඍ", "ए": "එ", "ऐ": "ඓ", "ओ": "ඔ",
    "औ": "ඖ", "ऍ": "එ", "ऑ": "ඔ", "ऎ": "එ", "ऒ": "ඔ",
    "क": "ක", "ख": "ඛ", "ग": "ග", "घ": "ඝ", "ङ": "ඞ", "च": "ච", "छ": "ඡ", "ज": "ජ", "झ": "ඣ", "ञ": "ඤ",
    "ट": "ට", "ठ": "ඨ", "ड": "ඩ", "ढ": "ඪ", "ण": "ණ", "त": "ත", "थ": "ථ", "द": "ද", "ध": "ධ", "न": "න",
    "ऩ": "න", "प": "ප", "फ": "ඵ", "ब": "බ", "भ": "භ", "म": "ම", "य": "ය", "र": "ර", "ऱ": "ර", "ल": "ල",
    "ळ": "ළ", "ऴ": "ළ", "व": "ව", "श": "ශ", "ष": "ෂ", "स": "ස", "ह": "හ",
    "ा": "ා", "ि": "ි", "ी": "ී", "ु": "ු", "ू": "ූ", "ृ": "ෘ", "े": "ෙ", "ै": "ෛ", "ो": "ො", "ौ": "ෞ",
    "ॅ": "ෙ", "ॉ": "ො", "ॆ": "ෙ", "ॊ": "ො", "्": "්", "ं": "ං", "ँ": "ං", "ः": "ඃ",
    "।": ".", "॥": ".", "ऽ": "",
    **{chr(0x0966 + i): str(i) for i in range(10)},
}


def to_sinhala_script(text):
    """Devanagari letters -> Sinhala letters; everything else is left as it is."""
    if not text or not any("ऀ" <= ch <= "ॿ" for ch in text):
        return text
    out, i = [], 0
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if nxt == "़":  # nukta: फ़ is 'f' (ෆ); for the others the base letter is close enough
            out.append("ෆ" if ch == "फ" else _DEVA_TO_SI.get(ch, ch))
            i += 2
            continue
        out.append(_DEVA_TO_SI.get(ch, "" if "ऀ" <= ch <= "ॿ" else ch))
        i += 1
    return "".join(out)


def no_hindi(value):
    """to_sinhala_script applied to every string inside a dict / list (LLM output)."""
    if isinstance(value, str):
        return to_sinhala_script(value)
    if isinstance(value, list):
        return [no_hindi(v) for v in value]
    if isinstance(value, dict):
        return {k: no_hindi(v) for k, v in value.items()}
    return value


def si_name(label):
    return SI_NAMES.get(label, label)


def si_time(iso):
    try:
        dt = datetime.datetime.fromisoformat(iso)
    except Exception:
        return ""
    h = dt.hour
    part = "උදේ" if h < 12 else "දවල්" if h < 15 else "හවස" if h < 19 else "රෑ"
    h12 = h % 12 or 12
    today = datetime.date.today()
    day = "අද" if dt.date() == today else "ඊයේ" if dt.date() == today - datetime.timedelta(days=1) else dt.strftime("%m/%d")
    return f"{day} {part} {h12}:{dt.minute:02d}ට"


# ─── Models ──────────────────────────────────────────────────────────────────
_worlds = {}


def _world_model(vocab=None):
    # Separate instances from main.py's scan-for-item one (and one per word list),
    # because set_classes() mutates the model and that endpoint resets classes per request.
    vocab = tuple(vocab or PERSONAL_VOCAB)
    if vocab not in _worlds:
        m = YOLO("yolov8s-worldv2.pt")
        m.set_classes(list(vocab))
        _worlds[vocab] = m
    return _worlds[vocab]


# The fine-tuned everyday-items model (memocare_items.ipynb in Colab). When the
# weights file is present it replaces YOLO-World for personal items; its class
# names are mapped to the labels the rest of the service already uses.
ITEMS_MODEL_PATH = os.environ.get("ITEMS_MODEL", os.path.join("models", "memocare_items.pt"))
ITEMS_TO_LABEL = {"eyeglasses": "glasses", "medicine": "pill bottle", "phone": "cell phone",
                  # classes added in the second training round
                  "bag": "handbag", "footwear": "slippers", "flashlight": "torch"}
ITEMS_CONF = float(os.environ.get("ITEMS_CONF", "0.35"))
# The first model learned "medicine" mostly from pill-box photos and also fires on
# other small objects on plain backgrounds (a toothbrush scored 0.81), so it must
# be very sure. Lower this after retraining with tablet strips and home photos.
ITEMS_CLASS_CONF = {"medicine": float(os.environ.get("ITEMS_MEDICINE_CONF", "0.85"))}
_items = None


def _items_model():
    global _items
    if _items is None and os.path.exists(ITEMS_MODEL_PATH):
        _items = YOLO(ITEMS_MODEL_PATH)
        print("[remember_moments] using fine-tuned items model:", ITEMS_MODEL_PATH, list(_items.names.values()))
    return _items


COCO_CONF = 0.45
WORLD_CONF = 0.25
MAX_SIDE = 640


def _iou(a, b):
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0


def _prepare(jpeg_bytes):
    # Phone JPEGs are often stored sideways with an EXIF rotation tag - apply it,
    # or the normalized boxes we return won't line up with the on-screen preview.
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(jpeg_bytes))).convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=80)
    return img, buf.getvalue()


_noted = set()


def _note_once(msg):
    if msg not in _noted:
        _noted.add(msg)
        print(msg)


def _detect(img):
    with INFER_LOCK:
        return _detect_unlocked(img)


def _detect_unlocked(img):
    w, h = img.size
    out = []
    coco = _ctx["coco_model"]
    for r in coco(img, verbose=False):
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < COCO_CONF:
                continue
            label = coco.names[int(box.cls[0])]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            out.append({"label": label, "confidence": round(conf, 3),
                        "box": [x1 / w, y1 / h, x2 / w, y2 / h]})
    try:
        items = _items_model()
        if items is not None:  # fine-tuned model for the patient's everyday items
            # agnostic NMS: one box per object, even when two classes compete for it
            preds = [(ITEMS_TO_LABEL.get(items.names[int(b.cls[0])], items.names[int(b.cls[0])]), b)
                     for r in items.predict(img, conf=ITEMS_CONF, agnostic_nms=True, verbose=False)
                     for b in r.boxes
                     if float(b.conf[0]) >= ITEMS_CLASS_CONF.get(items.names[int(b.cls[0])], ITEMS_CONF)]
            try:   # extra essentials via YOLO-World (needs CLIP); if it fails, the items model still counts
                extra = _world_model(EXTRA_VOCAB)
                preds += [(EXTRA_TO_LABEL.get(EXTRA_VOCAB[int(b.cls[0])], EXTRA_VOCAB[int(b.cls[0])]), b)
                          for r in extra.predict(img, conf=EXTRA_CONF, verbose=False) for b in r.boxes]
            except Exception as e:
                _note_once("extra-items pass skipped (YOLO-World/CLIP unavailable): " + str(e)[:120])
        else:                  # fall back to open-vocabulary YOLO-World prompts
            world = _world_model()
            preds = [(WORLD_TO_LABEL.get(PERSONAL_VOCAB[int(b.cls[0])], PERSONAL_VOCAB[int(b.cls[0])]), b)
                     for r in world.predict(img, conf=WORLD_CONF, verbose=False) for b in r.boxes]
        for label, box in preds:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cand = {"label": label, "confidence": round(float(box.conf[0]), 3),
                    "box": [x1 / w, y1 / h, x2 / w, y2 / h]}
            # Same physical object found by both models (e.g. COCO "bottle"
            # and "pill bottle") - keep only the more confident one.
            clash = next((d for d in out if _iou(d["box"], cand["box"]) > 0.5), None)
            if clash is None:
                out.append(cand)
            elif cand["confidence"] > clash["confidence"]:
                out[out.index(clash)] = cand
            elif cand["confidence"] >= EXTRA_OVERRIDES.get((cand["label"], clash["label"]), 2):
                out[out.index(clash)] = cand
    except Exception as e:
        print("personal-items pass skipped:", e)

    for d in out:
        d["label_si"] = si_name(d["label"])
        d["box"] = [round(max(0.0, min(1.0, v)), 4) for v in d["box"]]
    out.sort(key=lambda d: d["confidence"], reverse=True)
    return out


def _remember_frame(pid, jpeg, detections):
    q = LIVE_FRAMES.setdefault(pid, deque(maxlen=12))
    q.append({"jpeg": jpeg, "detections": detections, "time": datetime.datetime.now().isoformat()})


# ─── Live detection (no permanent storage) ───────────────────────────────────
@router.post("/detect-live")
async def detect_live(
    patient_id: str = Form(...),
    file: UploadFile = File(None),
    esp32_url: str = Form(None),
    patient_name: str = Form(""),
):
    """Detection only. Frames are kept in a short in-memory ring buffer so a
    later /save-moment can pick the best ones - nothing hits Cloudinary or disk.
    Objects that match this patient's own saved ones come back labelled with
    their name ("සුනිල්ගේ කෝප්පය")."""
    # The phone screen is actively driving this patient right now - the ESP32
    # passive worker stands down meanwhile so the two don't both act on it.
    LAST_CLIENT[patient_id] = datetime.datetime.now().timestamp()
    if esp32_url:
        # Prefer the newest frame from the continuous MJPEG reader (no per-frame
        # capture round-trip to the camera); fall back to a single /capture.
        latest = _ctx.get("esp32_latest")
        raw = latest(esp32_url) if latest else None
        if raw is None:
            try:
                raw = requests.get(esp32_url, timeout=6).content
            except Exception as e:
                return {"status": "error", "message": f"ESP32 camera unreachable: {e}"}
    elif file is not None:
        raw = await file.read()
    else:
        return {"status": "error", "message": "Send a frame file or an esp32_url"}

    try:
        img, jpeg = _prepare(raw)
    except Exception:
        return {"status": "error", "message": "Frame was not a valid image"}

    first = (patient_name or "").strip().split(" ")[0]
    if first and PATIENT_NAMES.get(patient_id) != first:
        PATIENT_NAMES[patient_id] = first
    detections = _detect(img)
    _remember_frame(patient_id, jpeg, detections)

    shown = [dict(d) for d in detections]   # the stored frame keeps the plain labels
    _mark_owned(patient_id, patient_name, jpeg, shown)
    for d, s_ in zip(detections, shown):    # ...but remembers which ones belong to another resident
        if s_.get("other_owner"):
            d["other_owner"] = s_["other_owner"]
    result = {"status": "success", "detections": shown, "width": img.size[0], "height": img.size[1]}
    if esp32_url:
        # The app can't fetch the exact same ESP32 frame again, so send back
        # the one we analysed for display under the boxes.
        import base64
        result["frame_b64"] = base64.b64encode(jpeg).decode()
    return result


OWNED_MAX_PER_FRAME = 5   # embeddings are the slow part; a frame rarely has more personal things
# Live "සුනිල්ගේ කෝප්පය" label: a little looser than OBJECT_FAMILIAR (0.80) because
# the live camera sees the same cup from new angles; it is only ever compared
# with this patient's own saved things, so it cannot pick up another patient's.
OWNED_LIVE_SIM = float(os.environ.get("OWNED_LIVE_SIM", "0.75"))
OTHER_OWNER_SIM = float(os.environ.get("OTHER_OWNER_SIM", "0.82"))


def _owner_si(name):
    """'සුනිල්' -> 'සුනිල්ගේ', 'Sunil' -> 'Sunil ගේ', no name -> 'ඔයාගේ' (your)."""
    name = (name or "").strip().split(" ")[0]
    if not name:
        return "ඔයාගේ"
    return f"{name}ගේ" if any("඀" <= ch <= "෿" for ch in name) else f"{name} ගේ"


def _mark_owned(pid, patient_name, jpeg, detections):
    """Live view: compare each object with this patient's own gallery (built from
    the moments saved earlier, never another patient's) and relabel the ones
    that are theirs: 'සුනිල්ගේ කෝප්පය' / "Sunil's cup"."""
    gallery = OBJECT_GALLERY.get(pid) or {}
    checked = 0
    for d in detections:
        known = gallery.get(d["label"])
        if not known or d["label"] in FIXED_ANCHORS or checked >= OWNED_MAX_PER_FRAME:
            continue
        checked += 1
        emb = _object_embedding(jpeg, d["box"])
        if emb is None:
            continue
        sim = max((_cos(emb, g) for g in known), default=0.0)
        if sim >= OWNED_LIVE_SIM:
            name = (patient_name or "").strip().split(" ")[0]
            d["owned"] = True
            d["familiarity"] = round(sim, 3)
            d["label_si"] = f"{_owner_si(name)} {d['label_si']}"
            d["label_en"] = f"{name}'s {d['label']}" if name else f"your {d['label']}"
    # Shared rooms (an elder home): a thing that is not this patient's but clearly matches
    # another resident's own one is named as theirs and is never saved into this patient's
    # memories. Stricter than the own-match, because a wrong "not yours" hides a real thing.
    for d in detections:
        if d.get("owned") or d["label"] in FIXED_ANCHORS or checked >= OWNED_MAX_PER_FRAME:
            continue
        others = [(p, g[d["label"]]) for p, g in OBJECT_GALLERY.items()
                  if p != pid and d["label"] in g and p in PATIENT_NAMES]
        if not others:
            continue
        checked += 1
        emb = _object_embedding(jpeg, d["box"])
        if emb is None:
            continue
        own_sim = max((_cos(emb, g) for g in gallery.get(d["label"], [])), default=0.0)
        best_p, best_sim = max(((p, max(_cos(emb, x) for x in embs)) for p, embs in others), key=lambda t: t[1])
        if best_sim >= OTHER_OWNER_SIM and best_sim > own_sim + 0.05:
            other = PATIENT_NAMES[best_p]
            d["other_owner"] = other
            d["label_si"] = f"{_owner_si(other)} {d['label_si']}"
            d["label_en"] = f"{other}'s {d['label']}"


# ─── Short clips of essential things ─────────────────────────────────────────
# A moving picture is easier to recall than one photo, so when one of these is
# saved, the last few camera frames become a short clip (a few seconds). Only
# for these categories - not every cup and book - to keep uploads small.
ESSENTIAL_CLIP = {"pill bottle", "glasses", "keys", "wallet", "cell phone", "watch", "hearing aid",
                  "walking stick", "slippers", "remote"}
CLIP_FRAME_SECONDS = 0.6   # how long each camera frame stays on screen
CLIP_MIN_FRAMES = 3


def _make_clip(jpegs):
    """Camera frames -> a short MP4 (H.264, plays on phones). Returns the bytes or None."""
    import subprocess
    import tempfile
    import imageio_ffmpeg
    if len(jpegs) < CLIP_MIN_FRAMES:
        return None
    with tempfile.TemporaryDirectory() as tmp:
        size = None
        for i, jpeg in enumerate(jpegs):
            img = Image.open(io.BytesIO(jpeg)).convert("RGB")
            if size is None:   # at most 640 px wide/high, even sizes (H.264 needs them)
                k = min(1.0, 640 / max(img.width, img.height))
                size = (int(img.width * k) // 2 * 2, int(img.height * k) // 2 * 2)
            img.resize(size).save(os.path.join(tmp, f"{i:03d}.jpg"), "JPEG", quality=85)
        out = os.path.join(tmp, "clip.mp4")
        cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
               "-framerate", f"{1 / CLIP_FRAME_SECONDS:.4f}", "-i", os.path.join(tmp, "%03d.jpg"),
               "-vf", "fps=24,scale=in_range=full:out_range=tv,format=yuv420p", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "28",
               "-movflags", "+faststart", out]
        if subprocess.run(cmd, capture_output=True, timeout=60).returncode != 0 or not os.path.exists(out):
            return None
        with open(out, "rb") as f:
            return f.read()


def _attach_clip(pid, moment, labels, jpegs):
    """Background: build + upload the clip, then link it to the moment and to
    the 'last seen' record of each essential thing in it."""
    try:
        data = _make_clip(jpegs)
        if not data:
            return
        res = cloudinary.uploader.upload(io.BytesIO(data), folder="memocare_clips", resource_type="video")
        url = res.get("secure_url", "")
        if not url:
            return
        moment["clip_url"] = url
        for o in moment["objects"]:
            if o["label"] in labels:
                o["clip_url"] = url
                rec = LAST_SEEN.get(pid, {}).get(o["label"])
                if rec and rec.get("moment_id") == moment["id"]:
                    rec["clip_url"] = url
        _save()
        print(f"[remember_moments] clip saved for {', '.join(labels)}: {url}")
    except Exception as e:
        print("clip failed:", e)


def _upload(jpeg, folder):
    try:
        res = cloudinary.uploader.upload(io.BytesIO(jpeg), folder=folder)
        return res.get("secure_url", "")
    except Exception as e:
        print("Cloudinary upload failed:", e)
        return ""


def _object_embedding(jpeg, box):
    """MobileNet embedding of one detected object's crop (padded 10%)."""
    fn = _ctx.get("object_emb_fn")
    if not fn:
        return None
    img = Image.open(io.BytesIO(jpeg)).convert("RGB")
    w, h = img.size
    x1, y1, x2, y2 = box
    px, py = (x2 - x1) * 0.1, (y2 - y1) * 0.1
    crop = img.crop((max(0, (x1 - px) * w), max(0, (y1 - py) * h), min(w, (x2 + px) * w), min(h, (y2 + py) * h)))
    if crop.size[0] < 16 or crop.size[1] < 16:
        return None
    tmp = f"crop_{uuid.uuid4().hex[:6]}.jpg"
    try:
        crop.save(tmp, "JPEG")
        with INFER_LOCK:
            return fn(tmp)
    except Exception as e:
        print("object embedding failed:", e)
        return None
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def _infer_room(labels, configured=None):
    # A room someone set explicitly (e.g. where an ESP32 is mounted) is ground
    # truth; guessing from furniture is only for the moving phone camera.
    if configured:
        return configured, ROOM_SI.get(configured, configured)
    for lbl in labels:
        if lbl in ROOM_FROM_ANCHOR:
            return ROOM_FROM_ANCHOR[lbl]
    return None, None


@router.post("/save-moment")
async def save_moment(
    patient_id: str = Form(...),
    labels: str = Form(...),          # JSON list of labels the app saw consistently
    lat: float = Form(None),
    lng: float = Form(None),
    room: str = Form(None),           # optional manual room (ESP32 mount room, etc.)
    source: str = Form("phone"),
    dwell_seconds: float = Form(30),
    preview: bool = Form(False),      # true = only report what *would* be saved
):
    return save_moment_core(patient_id, labels, lat, lng, room, source, dwell_seconds, preview)


def save_moment_core(patient_id, labels, lat=None, lng=None, room=None, source="phone",
                     dwell_seconds=30, preview=False):
    """Shared by the /save-moment endpoint and the ESP32 passive worker."""
    try:
        wanted = [l for l in json.loads(labels) if l != "person"]
    except Exception:
        return {"status": "error", "message": "labels must be a JSON list"}
    if not wanted:
        return {"status": "error", "message": "Nothing to remember"}

    frames = list(LIVE_FRAMES.get(patient_id, []))
    if not frames:
        return {"status": "error", "message": "No live frames for this patient - run /detect-live first"}
    # Validation: a thing seen only as another resident's own one is not this patient's memory.
    def _theirs_only(lbl):
        hits = [d for fr in frames for d in fr["detections"] if d["label"] == lbl]
        return bool(hits) and all(d.get("other_owner") for d in hits)
    not_mine = [l for l in wanted if _theirs_only(l)]
    wanted = [l for l in wanted if l not in not_mine]
    if not wanted:
        return {"status": "success", "result": "unchanged", "same": [], "not_mine": not_mine, "say_si": ""}

    # Best 3 frames = the ones containing the most of the wanted objects.
    def frame_score(fr):
        present = {d["label"] for d in fr["detections"]}
        return len(present & set(wanted)), fr["time"]
    best = sorted(frames, key=frame_score, reverse=True)[:3]

    all_labels = {d["label"] for fr in best for d in fr["detections"]}
    anchors = sorted(all_labels & FIXED_ANCHORS)
    room_en, room_si = _infer_room(anchors, room)

    # No duplicates: a thing still in the place we last saw it is not saved
    # again - only its "last seen" time is refreshed. Only new things, or
    # things that moved, become a new memory.
    seen = LAST_SEEN.setdefault(patient_id, {})
    state = {}
    for lbl in wanted:
        prev = seen.get(lbl)
        if lbl in FIXED_ANCHORS or (prev and not _place_changed(prev, room_en, anchors, lat, lng)):
            state[lbl] = "same"
        else:
            state[lbl] = "moved" if prev else "new"
    new = [l for l in wanted if state[l] == "new"]
    moved = [l for l in wanted if state[l] == "moved"]
    same = [l for l in wanted if state[l] == "same"]

    if preview:
        parts = []
        if new:
            parts.append(f"{', '.join(si_name(l) for l in new)} මතක තියාගන්නවා.")
        if moved:
            parts.append(f"{', '.join(si_name(l) for l in moved)} අලුත් තැනක තියෙනවා - මතක තියාගන්නවා.")
        return {"status": "success", "preview": True, "new": new, "moved": moved, "same": same,
                "say_si": " ".join(parts)}

    now = datetime.datetime.now().isoformat()
    routines_done = _routines_seen(patient_id, new + moved + same)
    for lbl in same:
        if lbl in seen:
            seen[lbl]["time"] = now
            seen[lbl]["times_seen"] = seen[lbl].get("times_seen", 0) + 1
            if lat is not None and lng is not None:   # the latest GPS fix where it was seen
                seen[lbl]["lat"], seen[lbl]["lng"] = lat, lng
            _add_interaction(patient_id, "object", lbl, si_name(lbl), dwell_seconds)
    hook = _ctx.get("on_new_object")
    for lbl in new:
        if hook:
            hook(lbl)  # memory_quiz learns what this kind of object is used for
    wanted = new + moved
    if not wanted:
        _save()
        return {"status": "success", "result": "unchanged", "same": same, "say_si": "", "routines_done": routines_done}

    photo_urls = [u for u in (_upload(fr["jpeg"], "memocare_moments") for fr in best) if u]
    if not photo_urls:
        return {"status": "error", "message": "Could not upload the moment photos"}

    # Best box per label from the best frame that contains it.
    objects = []
    crops = {}
    for lbl in wanted:
        for fr in best:
            hit = next((d for d in fr["detections"] if d["label"] == lbl and not d.get("other_owner")), None)
            if hit:
                objects.append({**hit, "photo_url": photo_urls[min(best.index(fr), len(photo_urls) - 1)]})
                crops[lbl] = (fr["jpeg"], hit["box"])
                break

    # Adaptive step: compare each object with this patient's own gallery for
    # that label ("is this *your* usual cup?"), then grow the gallery.
    gallery = OBJECT_GALLERY.setdefault(patient_id, {})
    for obj in objects:
        if obj["label"] in FIXED_ANCHORS:
            continue
        emb = _object_embedding(*crops[obj["label"]])
        if emb is None:
            continue
        known = gallery.setdefault(obj["label"], [])
        best_sim = max((_cos(emb, g) for g in known), default=0.0)
        obj["familiar"] = bool(known) and best_sim >= OBJECT_FAMILIAR
        obj["familiarity"] = round(best_sim, 3)
        if best_sim < 0.95:  # near-duplicates add nothing new
            known.append(emb)
            gallery[obj["label"]] = known[-GALLERY_CAP:]

    moment = {
        "id": f"mom-{uuid.uuid4().hex[:8]}", "time": now, "source": source,
        "objects": objects, "anchors": anchors, "photo_urls": photo_urls,
        "lat": lat, "lng": lng, "room": room_en, "room_si": room_si,
        "dwell_seconds": dwell_seconds,
    }
    MOMENTS.setdefault(patient_id, []).append(moment)
    MOMENTS[patient_id] = MOMENTS[patient_id][-500:]
    essential = sorted({o["label"] for o in objects} & ESSENTIAL_CLIP)
    if essential:
        clip_frames = [fr["jpeg"] for fr in sorted(frames, key=lambda fr: fr["time"])]
        threading.Thread(target=_attach_clip, args=(patient_id, moment, essential, clip_frames), daemon=True).start()

    for obj in objects:
        if obj["label"] in FIXED_ANCHORS:
            continue
        seen[obj["label"]] = {
            "label": obj["label"], "label_si": obj["label_si"], "photo_url": obj["photo_url"],
            "box": obj["box"], "lat": lat, "lng": lng, "room": room_en, "room_si": room_si,
            "anchors": [a for a in anchors if a != obj["label"]], "time": now,
            "moment_id": moment["id"], "times_seen": seen.get(obj["label"], {}).get("times_seen", 0) + 1,
            "familiar": obj.get("familiar", False),
            "gallery_size": len(gallery.get(obj["label"], [])),
        }
        _add_interaction(patient_id, "object", obj["label"], obj["label_si"], dwell_seconds)
    _save()

    names_si = ", ".join(
        (f"ඔබේ සුපුරුදු {o['label_si']}" if o.get("familiar") else o["label_si"])
        for o in objects if o["label"] in new
    )
    moved_si = ", ".join(o["label_si"] for o in objects if o["label"] in moved)
    say_parts = []
    if names_si:
        say_parts.append(f"{names_si} මතක තියාගත්තා.")
    if moved_si:
        say_parts.append(f"{moved_si} අලුත් තැන මතක තියාගත්තා.")
    log = _ctx.get("log_diary_event")
    if log:
        where = f" in the {room_en.lower()}" if room_en else ""
        log(patient_id, "spent_time_with", detail=f"{', '.join(o['label'] for o in objects)}{where}", photo_url=photo_urls[0])
        save_db = _ctx.get("save_db")
        if save_db:
            save_db()

    return {"status": "success", "result": "saved", "moment": moment, "new": new, "moved": moved, "same": same,
            "say_si": " ".join(say_parts), "routines_done": routines_done}


def _routines_seen(pid, labels):
    """A pill bottle / toothbrush / plate seen near its routine's usual time marks the
    AI reminder done (routine_ai.camera_seen). Never stops a moment from saving."""
    try:
        import routine_ai
        return routine_ai.camera_seen(pid, labels)
    except Exception as e:
        print("routine camera signal failed:", e)
        return []


def _place_changed(prev, room_en, anchors, lat, lng):
    """Has this object moved since it was last saved? Room first (GPS can't
    tell rooms apart indoors), then nearby furniture, then GPS for big moves."""
    if prev.get("room") and room_en and prev["room"] != room_en:
        return True
    old_anchors, new_anchors = set(prev.get("anchors") or []), set(anchors)
    if old_anchors and new_anchors and not (old_anchors & new_anchors):
        return True
    if prev.get("lat") is not None and lat is not None and prev.get("lng") is not None and lng is not None:
        if _metres(prev["lat"], prev["lng"], lat, lng) > 15:
            return True
    return False


def _metres(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── People ──────────────────────────────────────────────────────────────────
def _cos(a, b):
    a, b = np.array(a), np.array(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


@router.post("/identify-person")
async def identify_person(patient_id: str = Form(...), ask: bool = Form(True)):
    return identify_core(patient_id, ask)


def identify_core(patient_id: str, ask: bool = True):
    """Runs face recognition on the newest live frame that has a person in it.
    ask=False is the instant check the app runs as soon as someone appears:
    registered family are greeted straight away, and an unknown face is just
    reported (no question, nothing stored) until they've stayed long enough."""
    if not _ctx.get("facenet_ok"):
        return {"status": "unavailable", "message": "Face recognition model is not installed on the server"}
    frames = [fr for fr in LIVE_FRAMES.get(patient_id, []) if any(d["label"] == "person" for d in fr["detections"])]
    if not frames:
        return {"status": "no_person"}
    fr = frames[-1]

    # Quality gate: a tiny or motion-blurred face gives an unreliable embedding,
    # so wait for a better frame (the app retries on no_face) instead of guessing.
    try:
        problem, quality = _face_quality(Image.open(io.BytesIO(fr["jpeg"])).convert("RGB"), LIVE_FACE_MIN_PX, LIVE_BLUR_MIN)
    except Exception:
        problem, quality = None, {}
    if problem:
        return {"status": "no_face", "quality": problem, **quality}

    tmp = f"face_{uuid.uuid4().hex[:6]}.jpg"
    with open(tmp, "wb") as f:
        f.write(fr["jpeg"])
    try:
        with INFER_LOCK:
            emb = _ctx["face_fn"](tmp)
    except Exception:
        emb = None
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    if not emb:
        return {"status": "no_face"}

    best, best_sim, second_sim, sure = _family_decision(_rank_faces(patient_id, emb))
    margin = round(best_sim - second_sim, 3)

    now = datetime.datetime.now()
    if best and sure and not _is_verified(best):
        # Seen before, but the caregiver hasn't confirmed who they are - don't
        # assert a family relation to the patient on an unverified claim.
        best["last_seen"] = now.isoformat()
        best["times_met"] = best.get("times_met", 0) + 1
        _save()
        return {"status": "pending_known", "person": _public_person(best), "similarity": round(best_sim, 3),
                "say_si": "මේ කෙනාව මම කලින් දැකලා තියෙනවා. Caregiver තවම තහවුරු කරලා නැහැ."}
    if best and sure:
        learned = False
        if FAMILY_LEARN <= best_sim < FACE_NEW_VIEW and _anchor_sim(emb, best) >= ANCHOR_AGREE:
            # Adaptive step: a confident match from a new angle/lighting becomes
            # another prototype, so tomorrow's recognition is more robust. Only
            # very sure matches that also agree with the enrolment photos, so
            # someone else's face can't slowly creep into this person's gallery.
            _add_view(best, emb)
            learned = True
        last = best.get("last_seen")
        # Log a "met" diary event at most once an hour per person.
        if not last or (now - datetime.datetime.fromisoformat(last)).total_seconds() > 3600:
            log = _ctx.get("log_diary_event")
            if log:
                log(patient_id, "met_person", detail=f"{best['name']} ({best['relation']})", photo_url=best.get("photo_url", ""))
        best["last_seen"] = now.isoformat()
        best["times_met"] = best.get("times_met", 0) + 1
        _save()
        who = f"{best['name']}" if best["name"] and best["name"] != best["relation_si"] else ""
        today = INTERACTIONS.get(patient_id, {}).get(_today(), {}).get(f"person:{best['id']}")
        again = " අද ආයෙත් ඇවිත්." if today and today["count"] >= 1 else ""
        say = f"මේ ඔබේ {best['relation_si']}{(' ' + who) if who else ''}.{again}"
        return {"status": "known", "person": _public_person(best), "similarity": round(best_sim, 3),
                "margin": margin, "learned_new_view": learned, "say_si": say}

    if not ask:
        return {"status": "unknown_silent", "similarity": round(best_sim, 3), "margin": margin}

    pending_id = uuid.uuid4().hex[:10]
    PENDING_FACES[pending_id] = {
        "pid": patient_id, "embedding": emb, "jpeg": fr["jpeg"], "created": now.isoformat(),
        # Not sure enough to greet, but if the answer names this same person we
        # merge into them instead of creating a duplicate.
        "maybe_id": best["id"] if best and best_sim >= FACE_MAYBE else None,
    }
    return {"status": "unknown", "pending_id": pending_id,
            "say_si": "මේ කවුද? ඔබට හරි, එයාට හරි කියන්න පුළුවන්."}


@router.post("/log-interaction")
async def log_interaction(patient_id: str = Form(...), kind: str = Form(...), ref: str = Form(...),
                          seconds: float = Form(...), name_si: str = Form("")):
    """Called by the app when an identified person leaves the camera view, with
    how long they were together - feeds the daily story ("about 6 minutes with
    your son")."""
    if kind == "person" and not name_si:
        p = next((x for x in PEOPLE.get(patient_id, []) if x["id"] == ref), None)
        name_si = p["relation_si"] if p else ""
    _add_interaction(patient_id, kind, ref, name_si, seconds)
    _save()
    return {"status": "success"}


def _public_person(p):
    out = {k: v for k, v in p.items() if k not in ("embedding", "embeddings", "anchors")}
    out["face_samples"] = len(p.get("embeddings", []))
    out["enrol_photos"] = len(_anchors(p))
    return out


def parse_person_answer(text):
    """'මේ මගේ පුතා කමල්' -> name 'කමල්', relation son. Keyword rules first; the
    LLM only fills gaps (it's slower and needs the network)."""
    text = (text or "").strip()
    relation = None
    for word, rel in RELATIONS.items():
        if word in text.lower():
            relation = rel
            break

    name = ""
    if GROQ_API_KEY:
        try:
            out = _llm_json(
                "Someone answered 'who is this?' in Sinhala or English. The speaker is EITHER the elderly patient "
                "('this is my son Kamal') OR the visitor introducing themselves ('I am his son', 'මම එයාගේ පුතා'). "
                "Return the VISITOR's first name (if said) and the visitor's relationship TO THE PATIENT. Reply "
                'ONLY with JSON {"name": "...", "relation_en": "...", "relation_si": "..."}; use "" when unknown.\n\n'
                f"Sentence: {text}")
            name = (out.get("name") or "").strip()
            if not relation and out.get("relation_en"):
                relation = (out["relation_en"], out.get("relation_si") or out["relation_en"])
        except Exception as e:
            print("person parse LLM failed:", e)

    if not relation:
        relation = ("family member", "පවුලේ කෙනෙක්")
    if not name:
        name = relation[1]
    return {"name": name, "relation": relation[0], "relation_si": relation[1]}


@router.post("/save-person")
async def save_person(patient_id: str = Form(...), pending_id: str = Form(...), answer_text: str = Form(""),
                      relation: str = Form(""), name: str = Form("")):
    pending = PENDING_FACES.pop(pending_id, None)
    if not pending or pending["pid"] != patient_id:
        return {"status": "error", "message": "That face capture expired - point the camera at them again"}
    answer_text, name = to_sinhala_script(answer_text), to_sinhala_script(name)  # stored and shown to the caregiver

    if relation:
        # Already interpreted by /transcribe - skip a second LLM call.
        rel_si = EN_REL_TO_SI.get(relation.lower(), relation)
        parsed = {"name": name or rel_si, "relation": relation.lower(), "relation_si": rel_si}
    else:
        parsed = parse_person_answer(answer_text)
    now = datetime.datetime.now().isoformat()

    # A spoken claim ("I'm his son") is never trusted on its own - a stranger
    # could say it. It's checked against the face(s) the caregiver registered
    # for that relation, and only a matching face is accepted.
    verified = [p for p in PEOPLE.get(patient_id, []) if _is_verified(p)]
    same_rel = [p for p in verified if p["relation"] == parsed["relation"]]
    if same_rel:
        sim, match = max(((_face_sim(pending["embedding"], p), p) for p in same_rel), key=lambda x: x[0])
        if sim >= FAMILY_VERIFY and _anchor_sim(pending["embedding"], match) >= FACE_MAYBE:
            if sim >= FAMILY_LEARN or _anchor_sim(pending["embedding"], match) >= FAMILY_MATCH:
                _add_view(match, pending["embedding"])
            match["last_seen"] = now
            match["times_met"] = match.get("times_met", 0) + 1
            _save()
            _log_met(patient_id, match)
            who = match["name"] if match["name"] != match["relation_si"] else ""
            return {"status": "success", "result": "verified", "person": _public_person(match), "similarity": round(sim, 3),
                    "say_si": " ".join(f"හරි, මේ ඔබේ {match['relation_si']} {who}. ඊළඟ වතාවේ මම හොඳින් අඳුනගන්නම්.".split())}

        # Claimed a registered relation but the face doesn't match: refuse and tell the caregiver.
        alert = {"id": f"al-{uuid.uuid4().hex[:8]}", "kind": "identity_mismatch",
                 "claimed": parsed["relation"], "claimed_si": parsed["relation_si"], "claimed_name": parsed["name"],
                 "registered_name": match["name"], "similarity": round(sim, 3), "said": answer_text,
                 "photo_url": _upload(pending["jpeg"], "memocare_alerts"), "time": now, "seen": False}
        FAMILY_ALERTS.setdefault(patient_id, []).append(alert)
        _save()
        log = _ctx.get("log_diary_event")
        if log:
            log(patient_id, "identity_mismatch", detail=f"someone claimed to be the {parsed['relation']}",
                photo_url=alert["photo_url"], channel="caregiver_alert")
        return {"status": "success", "result": "rejected", "person": None, "alert": alert,
                "say_si": "සමාවෙන්න, මට මේ කෙනාව හඳුනාගන්න බැහැ. මම ඔබේ caregiver ට කියන්නම්."}

    # Nobody registered with that relation yet: remember them, but as "pending"
    # until the caregiver approves them in the Family screen.
    person = {
        "id": f"per-{uuid.uuid4().hex[:8]}", "name": parsed["name"], "relation": parsed["relation"],
        "relation_si": parsed["relation_si"], "embeddings": [pending["embedding"]],
        "photo_url": _upload(pending["jpeg"], "memocare_people"), "created": now, "last_seen": now,
        "times_met": 1, "said": answer_text, "status": "pending",
    }
    PEOPLE.setdefault(patient_id, []).append(person)
    _save()
    return {"status": "success", "result": "pending", "person": _public_person(person),
            "say_si": "හරි, මම මතක තියාගන්නම්. ඔබේ caregiver තහවුරු කළාම සම්පූර්ණ වෙනවා."}


def _is_verified(p):
    # Records from before verification existed have no status - they were
    # created by an explicit answer, so keep treating them as verified.
    return p.get("status", "verified") == "verified"


def _face_sim(emb, person):
    return max((_cos(emb, g) for g in person.get("embeddings", [])), default=0.0)


def _anchors(person):
    """The caregiver's enrolment photos - never trimmed or replaced by learned views.
    People saved before anchors existed fall back to their whole gallery."""
    return person.get("anchors") or person.get("embeddings", [])


def _anchor_sim(emb, person):
    return max((_cos(emb, g) for g in _anchors(person)), default=0.0)


def _add_view(person, emb):
    """Learned views rotate within the cap; the anchors always stay."""
    anchors = person.get("anchors") or []
    learned = [e for e in person.get("embeddings", []) if e not in anchors] + [emb]
    person["embeddings"] = anchors + learned[-max(GALLERY_CAP - len(anchors), 3):]


def _rank_faces(patient_id, emb, only=None):
    """-> [(sim, anchor_sim, person)] best first, over the patient's family."""
    people = [p for p in PEOPLE.get(patient_id, []) if p.get("embeddings") and (only is None or only(p))]
    return sorted(((_face_sim(emb, p), _anchor_sim(emb, p), p) for p in people), key=lambda x: x[0], reverse=True)


def _family_decision(ranked):
    """Margin rule: (person, sim, second_sim, sure). Sure only when the best match is
    above FAMILY_MATCH, agrees with that person's enrolment photos, and beats the
    next family member by FAMILY_MARGIN - otherwise two look-alike relatives
    (brothers, a grandson and his cousin) would be greeted by a coin flip."""
    if not ranked:
        return None, 0.0, 0.0, False
    sim, a_sim, p = ranked[0]
    second = ranked[1][0] if len(ranked) > 1 else 0.0
    sure = sim >= FAMILY_MATCH and a_sim >= ANCHOR_AGREE and sim - second >= FAMILY_MARGIN
    return p, sim, second, sure


def _face_quality(img, min_px, blur_min):
    """Size + sharpness gate on the single biggest face. -> (problem or None, info)."""
    detector = _ctx.get("face_detector")
    if detector is None:
        return None, {}
    with INFER_LOCK:
        boxes, probs = detector.detect(img)
    faces = [(b, p) for b, p in zip(boxes if boxes is not None else [], probs if probs is not None else []) if p and p >= 0.90]
    if not faces:
        return "no_face", {}
    (x1, y1, x2, y2), prob = max(faces, key=lambda f: (f[0][2] - f[0][0]))
    width = float(x2 - x1)
    crop = img.crop((max(0, int(x1)), max(0, int(y1)), int(x2), int(y2))).convert("L").resize((160, 160))
    g = np.asarray(crop, dtype=np.float32)
    lap = g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:] - 4 * g[1:-1, 1:-1]
    info = {"faces": len(faces), "face_px": round(width), "sharpness": round(float(lap.var()), 1), "prob": round(float(prob), 3)}
    if width < min_px:
        return "small", info
    if info["sharpness"] < blur_min:
        return "blurry", info
    return None, info


def _log_met(patient_id, person):
    log = _ctx.get("log_diary_event")
    if log:
        log(patient_id, "met_person", detail=f"{person['name']} ({person['relation']})", photo_url=person.get("photo_url", ""))
        if _ctx.get("save_db"):
            _ctx["save_db"]()


@router.get("/people/{patient_id}")
async def list_people(patient_id: str):
    people = sorted(PEOPLE.get(patient_id, []), key=lambda p: p.get("last_seen", ""), reverse=True)
    return {"status": "success", "people": [_public_person(p) for p in people]}


@router.delete("/people/{patient_id}/{person_id}")
async def delete_person(patient_id: str, person_id: str, pin: str = ""):
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN required"}
    PEOPLE[patient_id] = [p for p in PEOPLE.get(patient_id, []) if p["id"] != person_id]
    _save()
    return {"status": "success"}


# ─── Family registration (caregiver, PIN-protected) ──────────────────────────
def _hash_pin(pin):
    return hashlib.sha256(f"memocare:{pin}".encode()).hexdigest()


def _pin_ok(pid, pin):
    stored = CAREGIVER_PINS.get(pid)
    return bool(stored) and stored == _hash_pin(pin or "")


@router.get("/family/pin-status/{patient_id}")
async def pin_status(patient_id: str):
    return {"status": "success", "has_pin": patient_id in CAREGIVER_PINS}


@router.post("/family/pin")
async def set_pin(patient_id: str = Form(...), pin: str = Form(...), old_pin: str = Form("")):
    if not (pin.isdigit() and 4 <= len(pin) <= 6):
        return {"status": "error", "message": "PIN must be 4-6 digits"}
    if patient_id in CAREGIVER_PINS and not _pin_ok(patient_id, old_pin):
        return {"status": "error", "message": "Current PIN is wrong"}
    CAREGIVER_PINS[patient_id] = _hash_pin(pin)
    _save()
    return {"status": "success"}


@router.post("/family/pin/verify")
async def verify_pin(patient_id: str = Form(...), pin: str = Form(...)):
    return {"status": "success", "ok": _pin_ok(patient_id, pin)}


def _face_from_upload(raw):
    """-> (embedding, jpeg, problem). Exactly one clear, large-enough face, or a
    Sinhala reason the photo should be retaken."""
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    img.thumbnail((1024, 1024))
    problem, info = _face_quality(img, FACE_MIN_PX, BLUR_MIN)
    if problem == "no_face":
        return None, None, "මුහුණක් පේන්නේ නැහැ"
    if info.get("faces", 1) > 1:
        return None, None, "මුහුණු කිහිපයක් තියෙනවා - එක් කෙනෙක් විතරක් ඉන්න"
    if problem == "small":
        return None, None, "මුහුණ ගොඩක් පොඩියි - ළඟට එන්න"
    if problem == "blurry":
        return None, None, "Photo එක පැහැදිලි නැහැ (blur) - phone එක නොසෙල්වා ආයෙත් ගන්න"
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    jpeg = buf.getvalue()
    tmp = f"enroll_{uuid.uuid4().hex[:6]}.jpg"
    try:
        with open(tmp, "wb") as f:
            f.write(jpeg)
        with INFER_LOCK:
            emb = _ctx["face_fn"](tmp)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    if not emb:
        return None, None, "මුහුණ හඳුනාගන්න බැරි වුණා"
    return emb, jpeg, None


@router.post("/family/check-photo")
async def check_photo(file: UploadFile = File(...)):
    """Fast per-shot quality check while the caregiver is still taking photos."""
    if not _ctx.get("facenet_ok"):
        return {"status": "error", "message": "Face model not installed on the server"}
    emb, _jpeg, problem = _face_from_upload(await file.read())
    return {"status": "success", "ok": problem is None, "problem": problem}


@router.post("/family/enroll")
async def enroll_family(
    patient_id: str = Form(...), pin: str = Form(...), name: str = Form(...),
    relation: str = Form(...), files: list[UploadFile] = File(...),
    conversation_ok: bool = Form(False),
    confirm_different: bool = Form(False),
):
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN is wrong"}
    if not _ctx.get("facenet_ok"):
        return {"status": "error", "message": "Face model not installed on the server"}

    consistent, first_jpeg, problems, err = await _enrol_photos(files)
    if err:
        return err

    # Already registered? Compared with each person's ENROLMENT photos (anchors),
    # averaged over all the new photos - one look-alike shot is not a duplicate,
    # and views the app learned later can't block a new family member.
    similar = []
    for p in PEOPLE.get(patient_id, []):
        if p.get("embeddings"):
            sims = [_anchor_sim(e, p) for e in consistent]
            similar.append((float(np.mean(sims)), max(sims), p))
    similar.sort(key=lambda x: x[0], reverse=True)
    if similar and similar[0][0] >= FAMILY_MATCH and not confirm_different:
        mean_sim, _mx, p = similar[0]
        # Could be the same person again, or a look-alike relative (brother, son).
        # The caregiver decides - the PIN was already checked above.
        return {"status": "similar", "similarity": round(mean_sim, 3), "person": _public_person(p),
                "message": f"මේ මුහුණ '{p['name']}' ({p['relation_si']}) ට ගොඩක් සමානයි ({round(mean_sim * 100)}%). "
                           f"මේ වෙනම කෙනෙක්ද?",
                "message_en": f"This face looks very like {p['name']} ({p['relation']}) - {round(mean_sim * 100)}%. "
                              f"Is this a different person?"}

    relation = relation.lower().strip()
    rel_si = EN_REL_TO_SI.get(relation, relation)
    now = datetime.datetime.now().isoformat()
    person = {
        "id": f"per-{uuid.uuid4().hex[:8]}", "name": name.strip() or rel_si, "relation": relation,
        "relation_si": rel_si, "embeddings": list(consistent), "anchors": list(consistent),
        "photo_url": _upload(first_jpeg, "memocare_family"),
        "created": now, "last_seen": None, "times_met": 0, "status": "verified", "enrolled": True,
        # The family member's consent for visit conversations to be summarised (visit_talk.py).
        "conversation_ok": bool(conversation_ok),
        **({"conversation_consent_at": now} if conversation_ok else {}),
    }
    PEOPLE.setdefault(patient_id, []).append(person)
    cleaned = {}
    if confirm_different:
        # The caregiver said "a different person": views of this new person the
        # app may have wrongly learned into the look-alike's gallery are removed.
        for mean_sim, _mx, p in similar:
            if mean_sim >= FAMILY_MATCH:
                n = _drop_views_closer_to(p, person)
                if n:
                    cleaned[p["name"]] = n
    _save()
    return {"status": "success", "person": _public_person(person), "photos_used": len(consistent),
            "problems": problems, "cleaned_views": cleaned}


async def _enrol_photos(files):
    """Quality-check every photo and keep the ones that agree with each other.
    -> (embeddings, first_jpeg, problems, error_response or None)"""
    embeddings, first_jpeg, problems = [], None, []
    for i, f in enumerate(files):
        emb, jpeg, problem = _face_from_upload(await f.read())
        if problem:
            problems.append(f"Photo {i + 1}: {problem}")
            continue
        embeddings.append(emb)
        first_jpeg = first_jpeg or jpeg
    if len(embeddings) < 2:
        return [], None, problems, {"status": "error", "message": "හොඳ photos අවම 2ක් ඕනේ.", "problems": problems}
    # Photos of one person should agree with each other - catches a photo of the
    # wrong person slipping into the set.
    centre = np.mean(np.array(embeddings), axis=0)
    consistent = [e for e in embeddings if _cos(e, centre) >= 0.6]
    if len(consistent) < 2:
        return [], None, problems, {"status": "error", "message": "Photos එකම කෙනාගේ වගේ පේන්නේ නැහැ. ආයෙත් ගන්න.",
                                    "problems": problems}
    return consistent, first_jpeg, problems, None


def _drop_views_closer_to(person, other):
    """Remove learned (non-anchor) views of `person` that look more like `other`."""
    anchors = person.get("anchors") or []
    keep, dropped = [], 0
    for e in person.get("embeddings", []):
        if e in anchors or _anchor_sim(e, person) >= _anchor_sim(e, other):
            keep.append(e)
        else:
            dropped += 1
    person["embeddings"] = keep
    return dropped


def _rebuild_anchors(person):
    """For people saved before anchors existed: the enrolment photo (photo_url) is
    the truth; otherwise the densest group of views. Views that disagree with it
    are removed. -> number of views removed."""
    gallery = person.get("embeddings", [])
    if person.get("anchors") or len(gallery) < 2:
        return 0
    ref = None
    if person.get("photo_url"):
        try:
            import urllib.request
            raw = urllib.request.urlopen(person["photo_url"], timeout=15).read()
            ref, _j, _p = _face_from_upload(raw)
        except Exception as e:
            print("anchor photo download failed:", e)
    if ref is None:
        ref = max(gallery, key=lambda g: sum(_cos(g, h) >= FAMILY_MATCH for h in gallery))
    keep = [g for g in gallery if _cos(g, ref) >= ANCHOR_AGREE] or [ref]
    person["anchors"] = keep[:5]
    person["embeddings"] = keep
    return len(gallery) - len(keep)


@router.post("/family/add-photos")
async def add_family_photos(patient_id: str = Form(...), pin: str = Form(...), person_id: str = Form(...),
                            files: list[UploadFile] = File(...)):
    """More enrolment photos for someone already registered (another angle, glasses,
    new haircut) - several photos per person make recognition steadier."""
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN is wrong"}
    person = next((p for p in PEOPLE.get(patient_id, []) if p["id"] == person_id), None)
    if not person:
        return {"status": "error", "message": "Person not found"}
    consistent, _j, problems, err = await _enrol_photos(files)
    if err:
        return err
    _rebuild_anchors(person)
    if np.mean([_anchor_sim(e, person) for e in consistent]) < FACE_MAYBE:
        return {"status": "error", "message": f"මේ photos '{person['name']}' ගේ වගේ පේන්නේ නැහැ.", "problems": problems}
    person["anchors"] = ((person.get("anchors") or []) + consistent)[-10:]
    for e in consistent:
        _add_view(person, e)
    _save()
    return {"status": "success", "person": _public_person(person), "photos_used": len(consistent), "problems": problems}


@router.post("/family/clean-faces")
async def clean_faces(patient_id: str = Form(...), pin: str = Form(...)):
    """Give every registered person enrolment anchors and remove learned views that
    belong to someone else (fixes a person being greeted as their look-alike)."""
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN is wrong"}
    people = [p for p in PEOPLE.get(patient_id, []) if p.get("embeddings")]
    removed = {p["name"]: _rebuild_anchors(p) for p in people}
    for p in people:
        for q in people:
            if q is not p:
                removed[p["name"]] += _drop_views_closer_to(p, q)
    _save()
    return {"status": "success", "removed_views": removed}


@router.get("/family/{patient_id}")
async def family_overview(patient_id: str):
    people = PEOPLE.get(patient_id, [])
    alerts = sorted(FAMILY_ALERTS.get(patient_id, []), key=lambda a: a["time"], reverse=True)
    return {
        "status": "success",
        "verified": [_public_person(p) for p in people if _is_verified(p)],
        "pending": [_public_person(p) for p in people if p.get("status") == "pending"],
        "alerts": alerts[:30],
        "unseen_alerts": sum(1 for a in alerts if not a.get("seen")),
    }


@router.post("/family/review")
async def review_person(patient_id: str = Form(...), pin: str = Form(...), person_id: str = Form(...),
                        action: str = Form(...), name: str = Form(""), relation: str = Form("")):
    """Caregiver approves (optionally correcting name/relation) or rejects a pending person."""
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN is wrong"}
    people = PEOPLE.get(patient_id, [])
    p = next((x for x in people if x["id"] == person_id), None)
    if not p:
        return {"status": "error", "message": "Not found"}
    if action == "reject":
        PEOPLE[patient_id] = [x for x in people if x["id"] != person_id]
    else:
        if relation:
            p["relation"] = relation.lower()
            p["relation_si"] = EN_REL_TO_SI.get(relation.lower(), relation)
        if name:
            p["name"] = name
        p["status"] = "verified"
    _save()
    return {"status": "success"}


@router.post("/family/alerts/seen")
async def alerts_seen(patient_id: str = Form(...), pin: str = Form(...)):
    if not _pin_ok(patient_id, pin):
        return {"status": "error", "message": "Caregiver PIN is wrong"}
    for a in FAMILY_ALERTS.get(patient_id, []):
        a["seen"] = True
    _save()
    return {"status": "success"}


# ─── Things: last seen, find, map ────────────────────────────────────────────
@router.get("/last-seen/{patient_id}")
async def last_seen(patient_id: str):
    items = sorted(LAST_SEEN.get(patient_id, {}).values(), key=lambda x: x["time"], reverse=True)
    for it in items:
        it["when_si"] = si_time(it["time"])
    return {"status": "success", "items": items}


@router.get("/moments/{patient_id}")
async def list_moments(patient_id: str):
    return {"status": "success", "moments": list(reversed(MOMENTS.get(patient_id, [])))}


def label_from_speech(text, known_labels):
    t = (text or "").lower()
    # Longest spoken keyword first so "වතුර බෝතල" wins over "බෝතල".
    for word in sorted(SPOKEN_TO_LABEL, key=len, reverse=True):
        if word in t:
            return SPOKEN_TO_LABEL[word]
    for lbl in known_labels:
        if lbl in t or si_name(lbl) in text:
            return lbl
    if GROQ_API_KEY and known_labels:
        try:
            out = _llm_json(
                "An elderly patient asked (in Sinhala or English) where one of their things is. "
                f"Pick which of these saved object labels they mean: {sorted(known_labels)}. "
                'Reply ONLY with JSON {"label": "<one label from the list, or empty>"}.\n\n'
                f"Patient said: {text}")
            lbl = (out.get("label") or "").strip()
            if lbl in known_labels:
                return lbl
        except Exception as e:
            print("find intent LLM failed:", e)
    return None


def _find_payload(item):
    where = []
    if item.get("room_si"):
        # Locative "in the kitchen": කුස්සිය -> කුස්සියේ (vowel sign on the last consonant).
        where.append(item["room_si"] + "ේ")
    if item.get("anchors"):
        where.append(f"{si_name(item['anchors'][0])} ළඟ")
    if where:
        say = f"ඔබේ {item['label_si']} අන්තිමට දැක්කේ {si_time(item['time'])}, {', '.join(where)}. මම සිතියමේ පෙන්වන්නම්."
    else:   # no room or nearby furniture known: the photo shows where it was
        say = f"ඔබේ {item['label_si']} අන්තිමට දැක්කේ {si_time(item['time'])}. තිබ්බ තැන මේ පින්තූරයේ පේනවා."
    return {**item, "when_si": si_time(item["time"]), "say_si": say}


@router.get("/find-thing/{patient_id}")
async def find_thing(patient_id: str, q: str = "", label: str = ""):
    seen = LAST_SEEN.get(patient_id, {})
    lbl = label or label_from_speech(q, list(seen.keys()))
    if not lbl:
        return {"status": "success", "found": False, "say_si": "සමාවෙන්න, ඔබ හොයන්නේ මොකක්ද කියලා තේරුණේ නැහැ. ආයෙත් කියන්න."}
    item = seen.get(lbl)
    # How often the patient has to ask is itself a memory signal (memory report).
    log = FIND_LOG.setdefault(patient_id, [])
    log.append({"time": datetime.datetime.now().isoformat(), "label": lbl, "found": bool(item), "q": q[:80]})
    FIND_LOG[patient_id] = log[-1000:]
    _save()
    if not item:
        return {"status": "success", "found": False, "label": lbl,
                "say_si": f"මම තවම ඔබේ {si_name(lbl)} දැකලා නැහැ. ඒක හම්බුණාම කැමරාවට පෙන්වන්න."}
    return {"status": "success", "found": True, "item": _find_payload(item)}


# ─── Voice: speech-to-text and text-to-speech ────────────────────────────────
EN_REL_TO_SI = {en: si for en, si in RELATIONS.values()}

# How Whisper (asked for Hindi) spells Sinhala relation words in Devanagari.
DEVANAGARI_RELATIONS = {
    "पुता": "son", "पुथा": "son", "दुव": "daughter", "दूव": "daughter", "दुआ": "daughter", "दूअ": "daughter",
    "अम्मा": "mother", "तात्ता": "father", "ताता": "father", "नोना": "wife", "बिरिंद": "wife",
    "अय्या": "elder brother", "मल्ली": "younger brother", "अक्का": "elder sister", "नंगी": "younger sister",
    "यालुवा": "friend", "याळुवा": "friend", "यालुआ": "friend", "मुनुबुरा": "grandson", "मिनिबिरिय": "granddaughter",
}


def _relation_from_words(text):
    for word, (en, _si) in RELATIONS.items():
        if word in text:
            return en
    for word, en in DEVANAGARI_RELATIONS.items():
        if word in text:
            return en
    return ""


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), lang: str = Form("si"), patient_id: str = Form("")):
    """Speech -> text + meaning.

    Whisper's Sinhala-script output is unreliable (a test 'මගේ කෝප්පය කොහෙද' came
    back as 'සියින් කියේ්නේ'), but asked for Hindi it writes Sinhala *sounds*
    faithfully in Devanagari ('मगे कोप्पेय कोहिद'). So we transcribe phonetically
    and let the LLM read the sounds back as Sinhala and pull out the intent.
    On 5 test phrases this got every intent/object/relation right."""
    if not GROQ_API_KEY:
        return {"status": "error", "message": "GROQ_API_KEY is not set on the AI server"}
    audio = await file.read()
    data = {"model": "whisper-large-v3", "response_format": "json", "temperature": "0",
            "language": "en" if lang == "en" else "hi"}
    try:
        r = requests.post(f"{GROQ_BASE}/audio/transcriptions",
                          headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                          files={"file": (file.filename or "voice.m4a", audio)}, data=data, timeout=30)
        r.raise_for_status()
        heard = r.json().get("text", "").strip()
    except Exception as e:
        return {"status": "error", "message": f"Transcription failed: {e}"}
    if not heard:
        return {"status": "success", "text": "", "intent": "other"}

    known = sorted(set(LAST_SEEN.get(patient_id, {}).keys()) | {"cup", "bottle", "glasses", "cell phone", "book",
                                                                  "remote", "wallet", "pill bottle", "watch", "drinking glass"})
    try:
        meaning = _llm_json(
            ("This is a phonetic transcription (written in Devanagari) of an elderly Sri Lankan patient speaking "
             "SINHALA (sometimes mixed with English words)." if lang != "en" else
             "This is what an elderly patient said in English.") +
            " (When the app has just asked 'who is this?', the speaker may instead be the VISITOR introducing "
            "themselves, e.g. 'මම එයාගේ පුතා' = 'I am his son' - then relation is the visitor's relation TO THE "
            "PATIENT, and intent is 'introduce' either way.)"
            " Rewrite what they said in Sinhala script, then classify it. "
            f"Known objects: {known}. "
            'Reply ONLY JSON {"sinhala": "...", "intent": "find|introduce|other", "object": "<one known object or empty>", '
            '"relation": "<son/daughter/wife/husband/mother/father/elder brother/younger brother/elder sister/'
            'younger sister/grandson/granddaughter/friend/nurse/doctor or empty>", "name": "<person name or empty>"}.\n\n'
            f"Transcription: {heard}")
    except Exception as e:
        return {"status": "success", "text": to_sinhala_script(heard), "phonetic": heard, "intent": "other",
                "note": f"LLM failed: {e}"}

    rel = (meaning.get("relation") or "").strip().lower()
    intent = meaning.get("intent", "other")
    if not rel:
        # Short answers like "මම මෙයාගේ දුව" sometimes come back unclassified -
        # fall back to spotting the relation word in either transcript.
        rel = _relation_from_words(f"{meaning.get('sinhala', '')} {heard}")
        if rel:
            intent = "introduce"
    return {
        "status": "success",
        # "text" and "name" are shown on screen and saved - Sinhala letters only.
        # "phonetic" is the raw internal transcript (never displayed).
        "text": to_sinhala_script(meaning.get("sinhala") or heard),
        "phonetic": heard,
        "intent": intent,
        "object": meaning.get("object") if meaning.get("object") in known else "",
        "relation": rel,
        "relation_si": EN_REL_TO_SI.get(rel, ""),
        "name": to_sinhala_script((meaning.get("name") or "").strip()),
    }


# The app speaks with gTTS (the voice the patient is used to). A neural voice
# (Microsoft Edge read-aloud, e.g. si-LK-ThiliniNeural) can be switched on with
# TTS_ENGINE=neural; gTTS remains the fallback either way.
TTS_ENGINE = os.environ.get("TTS_ENGINE", "gtts")
TTS_VOICES = {"si": os.environ.get("TTS_VOICE_SI", "si-LK-ThiliniNeural"),
              "en": os.environ.get("TTS_VOICE_EN", "en-US-AriaNeural")}


async def synthesize(text, lang, path):
    """Write speech for `text` to `path` (mp3)."""
    if TTS_ENGINE == "neural":
        try:
            import edge_tts
            await edge_tts.Communicate(text, TTS_VOICES[lang], rate="-8%").save(path)
            if os.path.getsize(path) > 1000:
                return "neural"
        except Exception as e:
            print("neural TTS failed, using gTTS:", e)
    gTTS(text=text, lang=lang).save(path)
    return "gtts"


@router.get("/tts")
async def tts(text: str, lang: str = "si"):
    lang = "si" if lang == "si" else "en"
    voice = TTS_VOICES[lang] if TTS_ENGINE == "neural" else "gtts"
    key = hashlib.sha1(f"{voice}:{lang}:{text}".encode("utf-8")).hexdigest()[:20]
    path = os.path.join(TTS_DIR, f"{key}.mp3")
    if not os.path.exists(path):
        await synthesize(text, lang, path)
    return FileResponse(path, media_type="audio/mpeg")


GROQ_FALLBACK_MODEL = os.environ.get("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")


def _extract_json(text):
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("no JSON in the reply")
    return json.loads(text[start:end + 1])


def _llm_json(prompt):
    """JSON from the LLM, resilient to the two failures seen in practice:
    400 json_validate_failed (long Sinhala replies that break strict JSON mode ->
    retry without it and pull the JSON out), and 429 rate limits (short wait,
    then the smaller fallback model)."""
    import re as _re
    import time
    attempts = [(GROQ_MODEL, True), (GROQ_MODEL, True), (GROQ_MODEL, False), (GROQ_FALLBACK_MODEL, False)]
    last = None
    for i, (model, strict) in enumerate(attempts):
        body = {"model": model, "temperature": 0, "messages": [{"role": "user", "content": prompt}],
                # gpt-oss "thinks" before answering; on long Sinhala prompts the default
                # budget ran out mid-JSON (finish_reason=length). Low effort + room fixes it.
                "max_completion_tokens": 6000}
        if model.startswith("openai/gpt-oss"):
            body["reasoning_effort"] = "low"
        if strict:
            body["response_format"] = {"type": "json_object"}
        try:
            r = requests.post(f"{GROQ_BASE}/chat/completions",
                              headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                              json=body, timeout=60)
            if r.status_code == 429:
                # Free tier: 8000 tokens per minute. Wait as long as Groq asks (max ~40 s).
                wait = _re.search(r"try again in ([\d.]+)s", r.text)
                last = requests.HTTPError(f"429 rate limited ({model})")
                time.sleep(min(40.0, float(wait.group(1)) + 1) if wait else 5)
                continue
            r.raise_for_status()
            return _extract_json(r.json()["choices"][0]["message"]["content"])
        except Exception as e:
            last = e
    raise last


# ─── Memory vault story ──────────────────────────────────────────────────────
def _minutes(seconds):
    return max(1, round(seconds / 60))


# Story helpers: what is worth retelling. A story helps memory when it orients
# (day, date), puts people first, says where important things are and what is
# coming - not when it lists every object with clock times.
STORY_THINGS = {"glasses", "keys", "wallet", "pill bottle", "cell phone", "watch", "hearing aid", "remote",
                "walking stick", "slippers", "handbag", "umbrella", "book", "flask"}      # where they are matters
STORY_ROUTINE = {"cup": ("you had a drink from your cup", "ඔයා ඔයාගේ කෝප්පයෙන් බිව්වා"),
                 "plate": ("you had a meal", "ඔයා කෑම කෑවා"), "bowl": ("you ate from your bowl", "ඔයා බඳුනෙන් කෑවා"),
                 "kettle": ("the kettle was used for tea", "තේ හදන්න කේතලය පාවිච්චි කළා"),
                 "toothbrush": ("you brushed your teeth", "ඔයා දත් මැද්දා"), "towel": ("you used your towel", "ඔයා තුවාය පාවිච්චි කළා")}
DAYS_SI_STORY = ["සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා", "ඉරිදා"]
MONTHS_SI_STORY = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්",
                   "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"]


def _part_of_day(iso, si):
    h = int(iso[11:13])
    if si:
        return "උදේ" if h < 12 else "දවල්" if h < 15 else "හවස" if h < 19 else "රෑ"
    return "in the morning" if h < 12 else "around midday" if h < 15 else "in the afternoon" if h < 19 else "at night"


def _date_words(day, si):
    d = datetime.date.fromisoformat(day)
    if si:
        return f"{DAYS_SI_STORY[d.weekday()]}, {MONTHS_SI_STORY[d.month - 1]} {d.day}"
    return f"{d.strftime('%A')}, {d.day} {d.strftime('%B')}"


def build_story(patient_id, day, lang="si"):
    """The day's events -> a short, warm story that helps memory: day and date,
    people first, what was said and promised, where important things are, what
    is coming, and the main event repeated at the end. No clock times. Returns
    None when nothing happened that day."""
    moments = [m for m in MOMENTS.get(patient_id, []) if m["time"].startswith(day)]
    inter = INTERACTIONS.get(patient_id, {}).get(day, {})
    people_by_id = {p["id"]: p for p in PEOPLE.get(patient_id, [])}
    met_ids = {rec["ref"] for rec in inter.values() if rec["kind"] == "person"}
    met_ids |= {p["id"] for p in PEOPLE.get(patient_id, []) if (p.get("created") or "").startswith(day)}
    people = [people_by_id[i] for i in met_ids if i in people_by_id]

    if not moments and not people:
        return None

    si = lang == "si"
    # In Sinhala mode the events carry the exact Sinhala words, so the LLM can't
    # mistranslate (it once turned "cup" into කුප්පි, a bottle word).
    obj_name = (lambda o: o["label_si"]) if si else (lambda o: o["label"])
    lines = [f"- DATE: " + (f"අද {_date_words(day, si)}." if si else f"Today is {_date_words(day, si)}.")]
    main = None
    # 1. People first - the day's main events.
    for p in people:
        rec = inter.get(f"person:{p['id']}")
        part = _part_of_day(rec["first"], si) if rec and rec.get("first") else ""
        mins = _minutes(rec["seconds"]) if rec and rec["seconds"] else 0
        name = f" {p['name']}" if p["name"] != p["relation_si"] else ""
        if si:
            who = f"ඔයාගේ {p['relation_si']}{name}"
            line = f"{part} {who} ඔයා එක්ක හිටියා" + (f", විනාඩි {mins}ක් විතර." if mins else ".")
            main = main or f"අද {who} ඔයාව බලන්න ආවා."
        else:
            who = f"your {p['relation']}{name}"
            line = f"{who.capitalize()} was with you {part}" + (f" for about {mins} minutes." if mins else ".")
            main = main or f"Today {who} came to see you."
        lines.append(f"- PEOPLE: {line.strip()}")
    # What was talked about during visits (only summaries, only with consent - visit_talk.py).
    talks_for = _ctx.get("conversations_for")
    for c in (talks_for(patient_id, day) if talks_for else []):
        p = people_by_id.get(c["person_id"])
        if not p:
            continue
        rel = p["relation_si"] if si else p["relation"]
        topics = ", ".join(t["si"] if si else t["en"] for t in c.get("topics", []) if t.get("si"))
        if topics:
            lines.append("- TALK: " + (f"ඔයාගේ {rel} ඔයා එක්ක {topics} ගැන කතා කළා." if si
                                       else f"Your {rel} talked with you about {topics}."))
        for pr in c.get("promises", []):
            text = pr["si"] if si else pr["en"]
            lines.append("- COMING: " + (f"ඔයාගේ {rel} කිව්වා: {text}" if si else f"Your {rel} said: {text}"))
    # 2. Where the important things were last seen today (the latest sighting each).
    last_place = {}
    for m in moments:
        for o in m["objects"]:
            if o["label"] in STORY_THINGS:
                last_place[o["label"]] = (obj_name(o), m.get("room_si") if si else (m.get("room") or "").lower(),
                                          _part_of_day(m["time"], si))
    for name_, room, part in last_place.values():
        if si:   # locative like _find_payload: කුස්සිය -> කුස්සියේ
            lines.append(f"- PLACE: ඔයාගේ {name_} අන්තිමට {part} තිබුණේ {room}ේ." if room
                         else f"- PLACE: ඔයාගේ {name_} {part} දැක්කා.")
        else:
            lines.append(f"- PLACE: Your {name_} was last seen in the {room} {part}." if room
                         else f"- PLACE: Your {name_} was seen {part}.")
        main = main or (f"ඔයාගේ {name_} තියෙන තැන මතක තියාගන්න." if si else f"Remember where your {name_} is.")
    # 3. Small routine wins (only what a saved photo shows), once each.
    seen = {o["label"]: m["time"] for m in moments for o in m["objects"] if o["label"] in STORY_ROUTINE}
    for lbl, t in seen.items():
        en, si_txt = STORY_ROUTINE[lbl]
        lines.append(f"- DONE: {_part_of_day(t, si)} {si_txt}." if si else f"- DONE: {en.capitalize()} {_part_of_day(t, si)}.")
    if len(lines) == 1:      # only the date - nothing worth a story
        return None
    if main:
        lines.append(f"- MAIN: {main}")

    language = "Sinhala (simple, spoken Sinhala, Sinhala script)" if lang == "si" else "simple English"
    title, story = "", None
    if GROQ_API_KEY:
        try:
            out = _llm_json(
                f"Join the sentences below into a short, warm bedtime memory story in {language} for an elderly "
                "person with dementia, like a loving grandchild retelling THEIR OWN day. They are already written in "
                "the right language: keep their words and facts, only join them smoothly. Order: DATE, PEOPLE, TALK, "
                "PLACE, DONE, COMING, and finish with the MAIN sentence (the most important thing, said again). "
                "Rules: add nothing new - no extra people, actions, feelings, food, weather or plans; no clock times; "
                "no quotation marks; "
                + ("spoken Sinhala as written (ඔයා, not ඔබ; තිබුණේ, not තිබේ); " if si else "") +
                "short, simple, positive sentences. "
                'Reply ONLY with JSON {"title": "<3-5 word title>", "story": "..."}.\n\n'
                "Sentences:\n" + "\n".join(lines))
            story, title = out.get("story"), out.get("title", "")
            if story:   # the model sometimes says the closing sentence twice
                import re as _re
                parts, kept = _re.split(r"(?<=[.!?])\s+", story.strip()), []
                for sent in parts:
                    if sent and (not kept or sent != kept[-1]):
                        kept.append(sent)
                story = " ".join(kept)
        except Exception as e:
            print("story LLM failed:", e)
    if not story:
        story = " ".join(l.split(": ", 1)[-1] for l in lines)

    photos = [u for m in moments for u in m["photo_urls"][:1]] + [p["photo_url"] for p in people if p.get("photo_url")]
    return {"title": title, "story": story, "photos": photos[:8], "date": day, "lang": lang,
            "people": [_public_person(p) for p in people], "moment_count": len(moments),
            "minutes_with_people": sum(_minutes(r["seconds"]) for r in inter.values() if r["kind"] == "person"),
            "created": datetime.datetime.now().isoformat()}


def _store_story(patient_id, day, lang, story, auto):
    story["auto"] = auto
    STORIES.setdefault(patient_id, {}).setdefault(day, {})[lang] = story
    _save()


@router.get("/memory-story/{patient_id}")
async def memory_story(patient_id: str, lang: str = "si", date: str = "", refresh: bool = False):
    day = date or _today()
    stored = STORIES.get(patient_id, {}).get(day, {}).get(lang)
    if stored and not refresh:
        return {"status": "success", **stored}
    story = build_story(patient_id, day, lang)
    if not story:
        msg = "අද තවම මතක සටහන් නැහැ. කැමරාවෙන් ඔබේ දවස පෙන්වන්න." if lang == "si" else "No memories saved today yet."
        return {"status": "success", "story": msg, "photos": [], "people": [], "date": day}
    # Past days and after-STORY_HOUR stories are final; earlier today is a preview.
    if day != _today() or datetime.datetime.now().hour >= STORY_HOUR:
        _store_story(patient_id, day, lang, story, auto=False)
    return {"status": "success", **story}


@router.post("/generate-story-now/{patient_id}")
async def generate_story_now(patient_id: str, lang: str = Form("si")):
    """Same as the nightly job, on demand (demos / caregiver button)."""
    story = build_story(patient_id, _today(), lang)
    if not story:
        return {"status": "empty", "message": "Nothing happened today yet"}
    _store_story(patient_id, _today(), lang, story, auto=False)
    return {"status": "success", **story}


@router.get("/memory-stories/{patient_id}")
async def memory_book(patient_id: str):
    """Every saved day's story, newest first - the patient's memory book."""
    days = []
    for day, by_lang in sorted(STORIES.get(patient_id, {}).items(), reverse=True):
        s = by_lang.get("si") or next(iter(by_lang.values()))
        days.append({"date": day, "title": s.get("title", ""), "cover": (s.get("photos") or [""])[0],
                     "auto": s.get("auto", False), "langs": sorted(by_lang.keys())})
    return {"status": "success", "days": days, "story_hour": STORY_HOUR}


def _nightly_story_loop():
    """At STORY_HOUR every day, write the story for every patient who did
    something today - so it's ready when the phone's 8 PM notification fires."""
    import time
    while True:
        try:
            if datetime.datetime.now().hour >= STORY_HOUR:
                day = _today()
                pids = set(MOMENTS) | set(INTERACTIONS) | set(PEOPLE)
                for pid in pids:
                    if STORIES.get(pid, {}).get(day, {}).get("si"):
                        continue
                    story = build_story(pid, day, "si")
                    if story:
                        _store_story(pid, day, "si", story, auto=True)
                        print(f"[nightly story] wrote {day} story for {pid}")
        except Exception as e:
            print("nightly story loop error:", e)
        time.sleep(300)


threading.Thread(target=_nightly_story_loop, daemon=True, name="nightly-story").start()
