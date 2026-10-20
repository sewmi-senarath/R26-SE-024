# -*- coding: utf-8 -*-
"""
Sensor-free adaptive routine reminders (medicine first).

The method tested in models/research/routine_reminders (strategy C): no camera or
sensor is needed - it learns only from the patient's "done" / "later" taps and the
caregiver's "given" confirmations.

1. Routine learning: the usual time of each task is the median of the times it
   was confirmed over the last 14 days (at least 3); before that, the time the
   caregiver set (default 08:00 / 20:00).
2. Risk-based timing: a reminder is due 15 min after the usual time if recent
   doses were missed (or memory is weak), otherwise 30 min.
3. Style learning: Thompson sampling over 9 styles (10 min early / on time /
   10 min late x text / AI voice / family voice) - a style that the patient acts
   on within an hour scores up.
4. Trust model: a Beta estimate of how often this patient's "done" tap is true,
   learned from the caregiver's confirmations. A tap from a patient below 80 %
   trust is not accepted on its own: the caregiver is asked to check.
5. Escalation: one follow-up reminder 30 min later, then a caregiver alert.

Kept separate from reminders.py (camera-learned routines) - nothing there changes.
Every text a person sees or hears comes in Sinhala and English (lang=si|en).
"""
import sltime as datetime  # Sri Lanka time whatever the host timezone (see sltime.py)
import json
import os
import random
import statistics
import threading
import uuid

from fastapi import APIRouter, File, Form, UploadFile

import memory_quiz
import remember_moments as rm

router = APIRouter()

DB_FILE = "routine_ai_db.json"
STATE = {}          # pid -> {"tasks": {...}, "trust": [a, b], "events": [...], "pending": {...}}
_lock = threading.Lock()

LEADS = [-10, 0, 10]
MODES = ["text", "ai_voice", "family_voice"]
ARMS = [f"{lead}|{mode}" for lead in LEADS for mode in MODES]
TRUST_OK = 0.8
FOLLOW_UP_MIN = 30
ANSWER_WINDOW_MIN = 60

# Routines a caregiver can add. cat picks the sentences below; every/until make a
# routine repeat through the day (water every 2 h ...); "custom" takes any name.
CATALOG = {
    "med_morning": {"cat": "med", "time": "08:00", "si": "උදේ බෙහෙත්", "en": "morning medicine"},
    "med_noon":    {"cat": "med", "time": "13:00", "si": "දවල් බෙහෙත්", "en": "afternoon medicine"},
    "med_evening": {"cat": "med", "time": "20:00", "si": "රෑ බෙහෙත්", "en": "evening medicine"},
    "breakfast":   {"cat": "meal", "time": "07:30", "si": "උදේ කෑම", "en": "breakfast"},
    "lunch":       {"cat": "meal", "time": "12:30", "si": "දවල් කෑම", "en": "lunch"},
    "dinner":      {"cat": "meal", "time": "19:30", "si": "රෑ කෑම", "en": "dinner"},
    "water":       {"cat": "water", "time": "09:00", "every": 2, "until": "18:00", "si": "වතුර", "en": "water"},
    "toilet":      {"cat": "toilet", "time": "08:00", "every": 3, "until": "20:00", "si": "වැසිකිළිය", "en": "toilet"},
    "brush":       {"cat": "hygiene", "time": "07:00", "si": "දත් මැදීම", "en": "brushing teeth"},
    "bath":        {"cat": "hygiene", "time": "17:00", "si": "නෑම", "en": "bath"},
    "walk":        {"cat": "walk", "time": "10:00", "si": "ඇවිදීම", "en": "a short walk"},
    "sleep":       {"cat": "sleep", "time": "21:30", "si": "නින්ද", "en": "bedtime"},
    "prayer":      {"cat": "prayer", "time": "18:00", "si": "පූජාව / යාච්ඤාව", "en": "prayers"},
    "call_family": {"cat": "call", "time": "19:00", "si": "පවුලට කෝල් කිරීම", "en": "calling family"},
    "glasses":     {"cat": "device", "time": "07:30", "si": "කණ්ණාඩි", "en": "glasses"},
    "hearing_aid": {"cat": "device", "time": "07:30", "si": "ශ්‍රවණාධාරය", "en": "hearing aid"},
    "custom":      {"cat": "custom", "time": "09:00", "si": "මගේම මතක් කිරීමක්", "en": "my own reminder"},
}
# Every new patient starts with a usual day, so no caregiver has to type routines in for
# each patient: the times are only a starting point - the real ones are learned from the
# patient's own "Done" taps within a few days. The caregiver only adds or removes extras.
DEFAULT_KEYS = ("brush", "breakfast", "med_morning", "lunch", "bath", "dinner", "med_evening", "sleep")
DEFAULT_TASKS = {k: {"kind": k, "cat": CATALOG[k]["cat"], "time": CATALOG[k]["time"], "si": CATALOG[k]["si"],
                     "en": CATALOG[k]["en"]} for k in DEFAULT_KEYS}

# Sentences per kind of routine: remind / follow-up / thanks, and the "done" word
# the caregiver messages use. {name} = "Sunil, " or "", {task} = the routine's name.
CAT_TEXT = {
    "med": {"remind": ("{name}{task} බොන වෙලාව හරි. බිව්වාම 'කළා' ඔබන්න.", "{name}it's time for your {task}. Tap 'Done' after you take it."),
            "follow_up": ("{name}{task} තාම බිව්වේ නැද්ද? දැන් බොන්න.", "{name}have you taken your {task} yet? Please take it now."),
            "thanks": ("හොඳයි! {task} බිව්වා කියලා සටහන් කළා.", "Great! I noted that you took your {task}."),
            "did": ("බිව්වා", "taken")},
    "meal": {"remind": ("{name}{task} කන වෙලාව හරි. කෑවාම 'කළා' ඔබන්න.", "{name}it's time for {task}. Tap 'Done' when you have eaten."),
             "follow_up": ("{name}{task} තාම කෑවේ නැද්ද? දැන් කන්න.", "{name}have you had your {task} yet? Please eat now."),
             "thanks": ("හොඳයි! {task} කෑවා කියලා සටහන් කළා.", "Great! I noted that you had your {task}."),
             "did": ("කෑවා", "eaten")},
    "water": {"remind": ("{name}ටිකක් වතුර බොමුද? වතුර වීදුරුවක් බොන්න.", "{name}time for some water. Please drink a glass."),
              "follow_up": ("{name}තාම වතුර බිව්වේ නැද්ද? දැන් ටිකක් බොන්න.", "{name}have you had some water? Please drink a little now."),
              "thanks": ("හොඳයි! වතුර බිව්වා කියලා සටහන් කළා.", "Great! I noted that you drank some water."),
              "did": ("බිව්වා", "drunk")},
    "toilet": {"remind": ("{name}වැසිකිළියට යන වෙලාව හරි.", "{name}it's time to go to the toilet."),
               "follow_up": ("{name}වැසිකිළියට ගියාද? දැන් යමු.", "{name}did you go to the toilet? Let's go now."),
               "thanks": ("හොඳයි! සටහන් කළා.", "Good! I noted it."),
               "did": ("ගියා", "gone")},
    "hygiene": {"remind": ("{name}{task} වෙලාව හරි.", "{name}it's time for {task}."),
                "follow_up": ("{name}තාම {task} කළේ නැද්ද? දැන් කරමු.", "{name}have you done {task} yet? Let's do it now."),
                "thanks": ("හොඳයි! {task} කළා කියලා සටහන් කළා.", "Great! I noted {task}."),
                "did": ("කළා", "done")},
    "walk": {"remind": ("{name}ටිකක් ඇවිදින වෙලාව හරි. පරිස්සමෙන් ඇවිදින්න.", "{name}time for a short walk. Walk carefully."),
             "follow_up": ("{name}ටිකක් ඇවිද්දද? පුටුවේ ඉඳන් හරි අත් පා හොලවන්න.", "{name}did you walk a little? You can also move your arms and legs in the chair."),
             "thanks": ("නියමයි! ඇවිද්දා කියලා සටහන් කළා.", "Well done! I noted your walk."),
             "did": ("ඇවිද්දා", "done")},
    "sleep": {"remind": ("{name}නිදාගන්න වෙලාව හරි. සුබ රාත්‍රියක්!", "{name}it's bedtime. Good night!"),
              "follow_up": ("{name}තාම ඇහැරිලාද? නිදාගන්න වෙලාව පහු වුණා.", "{name}still awake? It's past bedtime."),
              "thanks": ("සුබ රාත්‍රියක්!", "Good night!"),
              "did": ("නිදාගත්තා", "in bed")},
    "prayer": {"remind": ("{name}{task} වෙලාව හරි.", "{name}it's time for {task}."),
               "follow_up": ("{name}{task} කළාද?", "{name}have you done your {task}?"),
               "thanks": ("හොඳයි! සටහන් කළා.", "Good! I noted it."),
               "did": ("කළා", "done")},
    "call": {"remind": ("{name}{task} වෙලාව හරි.", "{name}it's time for {task}."),
             "follow_up": ("{name}{task} කළාද?", "{name}have you done the {task}?"),
             "thanks": ("හොඳයි! සටහන් කළා.", "Good! I noted it."),
             "did": ("කළා", "done")},
    "device": {"remind": ("{name}{task} දාගන්න අමතක කරන්න එපා.", "{name}don't forget to put on your {task}."),
               "follow_up": ("{name}{task} දාගත්තද?", "{name}are you wearing your {task}?"),
               "thanks": ("හොඳයි! {task} දාගත්තා කියලා සටහන් කළා.", "Great! I noted that you have your {task} on."),
               "did": ("දාගත්තා", "on")},
    "custom": {"remind": ("{name}{task} වෙලාව හරි.", "{name}it's time for {task}."),
               "follow_up": ("{name}තාම {task} කළේ නැද්ද?", "{name}have you done {task} yet?"),
               "thanks": ("හොඳයි! {task} කළා කියලා සටහන් කළා.", "Great! I noted {task}."),
               "did": ("කළා", "done")},
}
TEXT = {
    "check": {"si": "{patient} '{task}' {did} කියනවා. ඇත්තටම කළාද කියලා බලන්න.",
              "en": "{patient} says the {task} is {did}. Please check it really was."},
    "alert": {"si": "{patient} තාම '{task}' කළේ නැහැ (මතක් කිරීම් 2කට පස්සෙත්).",
              "en": "{patient} has not done the {task} yet (after 2 reminders)."},
    "later": {"si": "හරි, විනාඩි 10කින් ආයෙත් මතක් කරන්නම්.", "en": "Okay, I'll remind you again in 10 minutes."},
}


def _load():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                STATE.update(json.load(f))
        except Exception as e:
            print("routine_ai_db load failed:", e)


def _save():
    with _lock:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(STATE, f, ensure_ascii=False)


_load()


def _now():
    return datetime.datetime.now()


def _mins(dt):
    return dt.hour * 60 + dt.minute


def _clock(m):
    m = int(round(m)) % 1440
    return f"{m // 60:02d}:{m % 60:02d}"


def _patient(pid):
    st = STATE.setdefault(pid, {})
    st.setdefault("tasks", {k: dict(v) for k, v in DEFAULT_TASKS.items()})
    if not st.get("day_template"):   # patients made before the usual-day template get it once
        for k, v in DEFAULT_TASKS.items():
            st["tasks"].setdefault(k, dict(v))
        st["day_template"] = True
    for key, task in st["tasks"].items():   # tasks saved before the catalog existed
        task.setdefault("kind", key.split("@")[0])
        task.setdefault("cat", CATALOG.get(task["kind"], {}).get("cat", "custom"))
    st.setdefault("trust", [2.0, 1.0])               # prior: taps are mostly honest
    st.setdefault("bandit", {})                       # task -> {arm: [alpha, beta]}
    st.setdefault("events", [])                       # what happened, for learning and the report
    st.setdefault("today", {})                        # day -> task -> state of today's dose
    return st


def _log(st, **e):
    e["at"] = _now().isoformat(timespec="seconds")
    st["events"].append(e)
    st["events"] = st["events"][-2000:]


def _usual(st, task):
    """Median confirmed time over the last 14 days (>= 3 days), else the set time."""
    since = (_now().date() - datetime.timedelta(days=14)).isoformat()
    times = {}
    for e in st["events"]:
        if e.get("task") == task and e["type"] == "done" and e.get("accepted") and e["at"][:10] >= since:
            times.setdefault(e["at"][:10], _mins(datetime.datetime.fromisoformat(e["at"])))
    h, m = map(int, st["tasks"][task]["time"].split(":"))
    learned = len(times) >= 3
    return (statistics.median(times.values()) if learned else h * 60 + m), learned, len(times)


def _risk(st, task):
    """Share of the last 7 days on which this dose ended up missed."""
    days = [d for d in sorted(st["today"])[-8:-1] if task in st["today"][d]]
    missed = [not st["today"][d][task].get("done") for d in days]
    return sum(missed) / len(missed) if missed else 0.0


def _trust(st):
    a, b = st["trust"]
    return a / (a + b)


def _voice(st, task):
    """The family member's recorded reminder for this routine (or one for all routines)."""
    v = st.get("voices", {})
    return v.get(task) or v.get(st["tasks"].get(task, {}).get("kind", "")) or v.get("any")


def _pick_arm(st, task, test=False):
    arms = st["bandit"].setdefault(task, {a: [1.0, 1.0] for a in ARMS})
    has_voice = bool(_voice(st, task))
    if test:   # demo: start the test with the family's voice when one is recorded, else the AI voice
        return "0|family_voice" if has_voice else "0|ai_voice"
    # The family-voice styles can only be tried once a family member has recorded one.
    allowed = [a for a in ARMS if has_voice or not a.endswith("family_voice")]
    return max(allowed, key=lambda a: random.betavariate(*arms[a]))


def _reward(st, task, arm, acted):
    ab = st["bandit"].setdefault(task, {a: [1.0, 1.0] for a in ARMS})[arm]
    ab[0 if acted else 1] += 1


def _day(st, task):
    d = _now().date().isoformat()
    return st["today"].setdefault(d, {}).setdefault(task, {"done": False, "reminders": [], "check": None, "alert": False})


def _texts(kind, lang, cat=None, **kw):
    if kind in ("remind", "follow_up", "thanks"):
        si, en = CAT_TEXT.get(cat or "custom", CAT_TEXT["custom"])[kind]
        t = {"si": si, "en": en}
    else:
        t = TEXT[kind]
        if cat:
            did = CAT_TEXT.get(cat, CAT_TEXT["custom"])["did"]
            kw["did"] = {"si": did[0], "en": did[1]}
    return {"si": t["si"].format(**{k: v["si"] if isinstance(v, dict) else v for k, v in kw.items()}),
            "en": t["en"].format(**{k: v["en"] if isinstance(v, dict) else v for k, v in kw.items()}),
            "text": None}


def _say(kind, lang, cat=None, **kw):
    t = _texts(kind, lang, cat, **kw)
    t["text"] = t["en"] if lang == "en" else t["si"]
    return t


def _with_voice(st, task, item):
    """A family-voice reminder carries the recording to play (the text is still shown)."""
    v = _voice(st, task) if item.get("mode") == "family_voice" else None
    if v:
        # A recording made for this routine says everything. The one general recording
        # ("Amma, it's me - don't forget what you need to do now") is followed by the
        # routine's own sentence in the AI voice, so one recording serves every routine.
        own = v is st.get("voices", {}).get(task) or v is st.get("voices", {}).get(st["tasks"].get(task, {}).get("kind", ""))
        item.update({"audio_url": v["url"], "who": v.get("who", ""), "then_speak": not own})
    return item


def _patient_name(name, lang):
    first = (name or "").strip().split(" ")[0]
    return {"si": f"{first}, " if first else "", "en": f"{first}, " if first else ""}


# ─── Decide what is due right now ───────────────────────────────────────────
def due(pid, name="", lang="si", test_task=None):
    st = _patient(pid)
    now = _now()
    out = {"patient": [], "caregiver": []}
    for task, cfg in st["tasks"].items():
        today = _day(st, task)
        usual, learned, n_days = _usual(st, task)
        weak = (memory_quiz._level(pid)[1] or 100) < 50
        grace = 15 if (_risk(st, task) > 0.3 or weak) else 30
        test = test_task == task
        label = {"si": cfg["si"], "en": cfg["en"]}
        cat = cfg.get("cat", "custom")
        if test and (today["done"] or today["alert"] or today["check"]):   # a finished test starts over
            today.update({"done": False, "reminders": [], "check": None, "alert": False})
        if today["done"]:
            continue
        if today["check"] and not today["check"].get("answered"):
            out["caregiver"].append({"kind": "check", "task": task, "id": today["check"]["id"],
                                     **_say("check", lang, cat, patient=name or "Patient", task=label)})
            continue
        sent = today["reminders"]
        if not sent:
            arm = _pick_arm(st, task, test)
            lead = int(arm.split("|")[0])
            if test or _mins(now) >= usual + grace + lead:
                rid = f"rm-{uuid.uuid4().hex[:8]}"
                sent.append({"id": rid, "arm": arm, "at": now.isoformat(timespec="seconds"), "answered": False})
                _log(st, type="reminder", task=task, arm=arm, id=rid, test=test)
                out["patient"].append(_with_voice(st, task, {"kind": "remind", "task": task, "id": rid, "mode": arm.split("|")[1],
                                       **_say("remind", lang, cat, name=_patient_name(name, lang), task=label)}))
        elif len(sent) == 1 and not sent[0]["answered"]:
            first_at = datetime.datetime.fromisoformat(sent[0]["at"])
            if test or now - first_at >= datetime.timedelta(minutes=FOLLOW_UP_MIN):
                _reward(st, task, sent[0]["arm"], False)
                arm = _pick_arm(st, task)
                rid = f"rm-{uuid.uuid4().hex[:8]}"
                sent.append({"id": rid, "arm": arm, "at": now.isoformat(timespec="seconds"), "answered": False,
                             "follow_up": True})
                _log(st, type="reminder", task=task, arm=arm, id=rid, follow_up=True, test=test)
                out["patient"].append(_with_voice(st, task, {"kind": "follow_up", "task": task, "id": rid, "mode": arm.split("|")[1],
                                       **_say("follow_up", lang, cat, name=_patient_name(name, lang), task=label)}))
        elif len(sent) >= 2 and not sent[-1]["answered"] and not today["alert"]:
            last_at = datetime.datetime.fromisoformat(sent[-1]["at"])
            if test or now - last_at >= datetime.timedelta(minutes=FOLLOW_UP_MIN):
                _reward(st, task, sent[-1]["arm"], False)
                today["alert"] = True
                _log(st, type="caregiver_alert", task=task, test=test)
                out["caregiver"].append({"kind": "alert", "task": task,
                                         **_say("alert", lang, cat, patient=name or "Patient", task=label)})
    _save()
    return out


# ─── The camera as a second signal ──────────────────────────────────────────
# A routine's object seen near its usual time means it is being done - useful for
# patients who never tap "Done". Seeing the pill bottle is weaker proof than a
# caregiver's "Given", so it is logged as source="camera" and the caregiver can
# still answer "Not given".
CAMERA_EVIDENCE = {"pill bottle": "med", "medicine": "med", "toothbrush": "brush",
                   "plate": "meal", "bowl": "meal", "spoon": "meal"}
CAMERA_WINDOW_MIN = 90


def camera_seen(pid, labels):
    """Called when the room/phone camera saves a moment. -> tasks marked done."""
    cats = {CAMERA_EVIDENCE[l] for l in labels if l in CAMERA_EVIDENCE}
    if not cats or pid not in STATE:
        return []
    st = _patient(pid)
    now = _mins(_now())
    done = []
    for task, cfg in st["tasks"].items():
        key = "brush" if cfg.get("kind") == "brush" else cfg.get("cat")
        if key not in cats:
            continue
        usual, _, _ = _usual(st, task)
        if abs(now - usual) > CAMERA_WINDOW_MIN:
            continue
        today = _day(st, task)
        if today["done"]:
            continue
        today["done"] = True
        for r in today["reminders"]:
            if not r["answered"]:
                r["answered"] = True
                _reward(st, task, r["arm"], True)
        _log(st, type="done", task=task, source="camera", accepted=True)
        done.append(task)
    if done:
        _save()
    return done


# ─── Answers ────────────────────────────────────────────────────────────────
def patient_done(pid, task, lang="si"):
    """The patient tapped 'Done'. Accepted on its own only from a patient whose taps are trusted."""
    st = _patient(pid)
    today = _day(st, task)
    for r in today["reminders"]:
        if not r["answered"]:
            r["answered"] = True
            age = (_now() - datetime.datetime.fromisoformat(r["at"])).total_seconds() / 60
            _reward(st, task, r["arm"], age <= ANSWER_WINDOW_MIN)
    trusted = _trust(st) >= TRUST_OK
    if trusted:
        today["done"] = True
    else:
        today["check"] = {"id": f"ck-{uuid.uuid4().hex[:8]}", "asked": _now().isoformat(timespec="seconds"),
                          "answered": False}
    _log(st, type="done", task=task, source="patient", accepted=trusted, trust=round(_trust(st), 2))
    _save()
    cfg = st["tasks"][task]
    label = {"si": cfg["si"], "en": cfg["en"]}
    return {"accepted": trusted, "trust": round(_trust(st), 2), **_say("thanks", lang, cfg.get("cat"), task=label)}


def caregiver_answer(pid, task, given):
    """The caregiver confirms (given=True) or denies a dose - this is the ground truth.
    If the patient had tapped 'Done' today, the answer also teaches the trust model."""
    st = _patient(pid)
    today = _day(st, task)
    patient_tapped = any(e["type"] == "done" and e.get("source") == "patient" and e.get("task") == task
                         and e["at"][:10] == _now().date().isoformat() for e in st["events"])
    if patient_tapped:
        st["trust"][0 if given else 1] += 1
    if today["check"]:
        today["check"]["answered"] = True
    today["done"] = bool(given)
    if not given:   # not taken after all: start reminding again
        today["reminders"] = []
        today["alert"] = False
    _log(st, type="done" if given else "not_done", task=task, source="caregiver", accepted=bool(given))
    _save()
    return {"done": today["done"], "trust": round(_trust(st), 2)}


def snooze(pid, task, lang="si"):
    st = _patient(pid)
    today = _day(st, task)
    if today["reminders"]:
        last = today["reminders"][-1]
        last["answered"] = True
        _reward(st, task, last["arm"], False)
        # Ask again in 10 minutes: an unanswered reminder dated 20 min ago turns into the follow-up at +10.
        today["reminders"] = [{**last, "answered": False,
                               "at": (_now() - datetime.timedelta(minutes=FOLLOW_UP_MIN - 10)).isoformat(timespec="seconds")}]
    _log(st, type="later", task=task)
    _save()
    return _say("later", lang)


def overview(pid, lang="si"):
    st = _patient(pid)
    tasks = []
    for task, cfg in st["tasks"].items():
        usual, learned, n_days = _usual(st, task)
        today = _day(st, task)
        arms = st["bandit"].get(task, {})
        best = max(arms, key=lambda a: arms[a][0] / sum(arms[a])) if arms else None
        tasks.append({"task": task, "kind": cfg.get("kind"), "cat": cfg.get("cat", "custom"),
                      "si": cfg["si"], "en": cfg["en"], "set_time": cfg["time"],
                      "usual": _clock(usual), "learned": learned, "days_learned": n_days,
                      "risk": round(_risk(st, task), 2), "done_today": today["done"],
                      "reminders_today": len(today["reminders"]), "waiting_check": bool(today["check"] and not today["check"]["answered"]),
                      "best_style": best})
    _save()
    tasks.sort(key=lambda t: t["set_time"])
    voices = {k: {"who": v.get("who", ""), "url": v["url"]} for k, v in st.get("voices", {}).items()}
    return {"tasks": tasks, "trust": round(_trust(st), 2), "trust_ok": _trust(st) >= TRUST_OK, "voices": voices}


# ─── Endpoints ──────────────────────────────────────────────────────────────
@router.get("/routine-ai/{patient_id}")
async def routine_ai_overview(patient_id: str, lang: str = "si"):
    return {"status": "success", **overview(patient_id, lang)}


@router.get("/routine-ai/due/{patient_id}")
async def routine_ai_due(patient_id: str, name: str = "", lang: str = "si", test_task: str = ""):
    """Polled by the app. test_task=med_morning fires that reminder now (for demos and testing)."""
    return {"status": "success", **due(patient_id, name, lang, test_task or None)}


@router.post("/routine-ai/done")
async def routine_ai_done(patient_id: str = Form(...), task: str = Form(...), lang: str = Form("si")):
    return {"status": "success", **patient_done(patient_id, task, lang)}


@router.post("/routine-ai/later")
async def routine_ai_later(patient_id: str = Form(...), task: str = Form(...), lang: str = Form("si")):
    return {"status": "success", **snooze(patient_id, task, lang)}


PIN_WRONG = {"status": "error", "code": "pin", "message": "Caregiver PIN is wrong",
             "si": "Caregiver PIN එක වැරදියි", "en": "Caregiver PIN is wrong"}


@router.post("/routine-ai/caregiver")
async def routine_ai_caregiver(patient_id: str = Form(...), task: str = Form(...), given: bool = Form(...),
                               pin: str = Form("")):
    """Only the caregiver confirms a dose (the patient's own "Done" is a separate, weaker signal)."""
    if not rm._pin_ok(patient_id, pin):
        return PIN_WRONG
    return {"status": "success", **caregiver_answer(patient_id, task, given)}


@router.post("/routine-ai/time")
async def routine_ai_set_time(patient_id: str = Form(...), task: str = Form(...), time: str = Form(...),
                              pin: str = Form("")):
    """Caregiver sets the prescribed time (HH:MM), used until the real routine is learned."""
    if not rm._pin_ok(patient_id, pin):
        return PIN_WRONG
    st = _patient(patient_id)
    if task not in st["tasks"]:
        return {"status": "error", "message": "unknown task"}
    try:
        h, m = map(int, time.split(":"))
        assert 0 <= h < 24 and 0 <= m < 60
    except Exception:
        return {"status": "error", "message": "time must be HH:MM"}
    st["tasks"][task]["time"] = f"{h:02d}:{m:02d}"
    _save()
    return {"status": "success", **overview(patient_id)}


def _times(start, every, until):
    """'09:00', every 2 h until '18:00' -> ['09:00', '11:00', ... '17:00']."""
    h, m = map(int, start.split(":"))
    end_h, end_m = map(int, until.split(":"))
    t, end, out = h * 60 + m, end_h * 60 + end_m, []
    while t <= end and len(out) < 12:
        out.append(f"{t // 60:02d}:{t % 60:02d}")
        t += every * 60
    return out


@router.get("/routine-ai/catalog/list")
async def routine_ai_catalog(lang: str = "si"):
    """Routines a caregiver can add (name in the chosen language, default time, repeat)."""
    return {"status": "success", "items": [
        {"key": k, "cat": v["cat"], "name": v["en"] if lang == "en" else v["si"], "si": v["si"], "en": v["en"],
         "time": v["time"], "every": v.get("every"), "until": v.get("until")} for k, v in CATALOG.items()]}


@router.post("/routine-ai/add")
async def routine_ai_add(patient_id: str = Form(...), key: str = Form(...), time: str = Form(""),
                         every: int = Form(0), until: str = Form(""), name_si: str = Form(""), name_en: str = Form(""),
                         pin: str = Form("")):
    """Add a routine from the catalog (or key=custom with a name). every>0 repeats it
    every N hours until the given time (water, toilet). Adding one that exists
    just moves its time. Caregiver only (PIN)."""
    if not rm._pin_ok(patient_id, pin):
        return PIN_WRONG
    if key not in CATALOG:
        return {"status": "error", "message": "unknown routine"}
    c = CATALOG[key]
    start = time or c["time"]
    try:
        h, m = map(int, start.split(":"))
        assert 0 <= h < 24 and 0 <= m < 60
    except Exception:
        return {"status": "error", "message": "time must be HH:MM"}
    start = f"{h:02d}:{m:02d}"
    si = (name_si or name_en or c["si"]).strip() if key == "custom" else c["si"]
    en = (name_en or name_si or c["en"]).strip() if key == "custom" else c["en"]
    st = _patient(patient_id)
    every = every or (c.get("every") or 0)
    if every:
        for k in [k for k, t in st["tasks"].items() if t.get("kind") == key]:   # replace the old set
            del st["tasks"][k]
        for t in _times(start, every, until or c.get("until") or "20:00"):
            st["tasks"][f"{key}@{t}"] = {"kind": key, "cat": c["cat"], "time": t,
                                         "si": f"{si} ({t})", "en": f"{en} ({t})"}
    else:
        tid = f"custom_{uuid.uuid4().hex[:6]}" if key == "custom" else key
        st["tasks"][tid] = {"kind": key, "cat": c["cat"], "time": start, "si": si, "en": en}
    _log(st, type="routine_added", task=key, time=start, every=every)
    _save()
    return {"status": "success", **overview(patient_id)}


@router.post("/routine-ai/remove")
async def routine_ai_remove(patient_id: str = Form(...), task: str = Form(...), pin: str = Form("")):
    if not rm._pin_ok(patient_id, pin):
        return PIN_WRONG
    st = _patient(patient_id)
    if task not in st["tasks"]:
        return {"status": "error", "message": "not found"}
    del st["tasks"][task]
    _log(st, type="routine_removed", task=task)
    _save()
    return {"status": "success", **overview(patient_id)}


VOICE_DIR = os.path.join("uploads", "voices")


@router.post("/routine-ai/voice")
async def routine_ai_voice(patient_id: str = Form(...), task: str = Form("any"), who: str = Form(""),
                           pin: str = Form(""), file: UploadFile = File(...)):
    """A family member records a short reminder ("Amma, it's time for your medicine") for one
    routine, or task=any for all of them. The family-voice styles play it. Caregiver only (PIN)."""
    if not rm._pin_ok(patient_id, pin):
        return PIN_WRONG
    data = await file.read()
    if not data or len(data) > 5 * 1024 * 1024:
        return {"status": "error", "message": "recording is empty or too long"}
    os.makedirs(VOICE_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower() or ".m4a"
    name = f"{patient_id}-{task.replace('@', '_')}-{uuid.uuid4().hex[:6]}{ext}"
    with open(os.path.join(VOICE_DIR, name), "wb") as f:
        f.write(data)
    st = _patient(patient_id)
    st.setdefault("voices", {})[task] = {"url": f"/uploads/voices/{name}", "who": who.strip(),
                                         "at": _now().isoformat(timespec="seconds")}
    _log(st, type="voice_recorded", task=task, who=who.strip())
    _save()
    return {"status": "success", **overview(patient_id)}
