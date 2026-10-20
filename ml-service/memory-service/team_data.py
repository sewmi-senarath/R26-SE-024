"""
READ-ONLY access to the team's shared MongoDB, for the memory progress report.

The memory service never writes here - only find() / count. It reads:
  patients             care records made by caregivers (16 registered patients, real names)
  assessments          MMSE results of the cognitive-assessment component
  game_sessions        cognitive game results of the cognitive-games component
  severity_predictions the monitor / escalate triage of the severity component

Ids: the memory service stores data under the care-record id (what the login gives
once a caregiver has made a record) or, before that, under the user id. The other
components key their data by the user id (registeredPatientId). Both are tried.

Needs MONGO_URI in the environment (the same value the Node backend uses).
Without it, or when Mongo can't be reached, every function returns empty and the
report simply shows the memory component's own data.
"""
import os
import threading
import time

import sltime as datetime  # Sri Lanka time whatever the host timezone (see sltime.py)

MONGO_URI = os.environ.get("MONGO_URI", "")
CACHE_S = 30          # the progress screen refreshes every 30 s - one Mongo read per window
_client = None
_lock = threading.Lock()
_cache = {}           # key -> (epoch, value)


def _db():
    global _client
    if not MONGO_URI:
        return None
    with _lock:
        if _client is None:
            try:
                from pymongo import MongoClient
                _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000,
                                      socketTimeoutMS=8000, appname="memocare-memory-readonly")
            except Exception as e:
                print("[team_data] Mongo not available:", e)
                return None
    try:
        return _client.get_default_database()
    except Exception:
        return _client["test"]


def _cached(key, fn):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_S:
        return hit[1]
    try:
        val = fn()
    except Exception as e:
        print(f"[team_data] {key} read failed:", str(e)[:160])
        val = hit[1] if hit else None   # keep the last good answer through a short outage
    _cache[key] = (time.time(), val)
    return val


def available():
    return _db() is not None


def _iso(v):
    return v.isoformat() if hasattr(v, "isoformat") else str(v or "")


def patients():
    """[{care_id, user_id, name, age, condition, stage}] - every registered patient."""
    def load():
        db = _db()
        if db is None:
            return []
        out = []
        for p in db.patients.find({}, {"name": 1, "age": 1, "condition": 1, "stage": 1, "registeredPatientId": 1}):
            out.append({"care_id": str(p["_id"]), "user_id": str(p.get("registeredPatientId") or ""),
                        "name": (p.get("name") or "").strip() or "Patient", "age": p.get("age"),
                        "condition": p.get("condition"), "stage": p.get("stage")})
        return out
    return _cached("patients", load) or []


def find_patient(pid):
    """The registered patient a memory-service id belongs to (care id or user id)."""
    return next((p for p in patients() if pid in (p["care_id"], p["user_id"])), None)


def _by_patient(key, collection, projection, row):
    """Read one whole collection once per CACHE_S and group it by patientId -
    the all-patients report needs every patient at once."""
    def load():
        db = _db()
        if db is None:
            return {}
        out = {}
        for doc in db[collection].find({}, projection):
            r = row(doc)
            if r is not None:
                out.setdefault(str(doc.get("patientId")), []).append(r)
        return out
    return _cached(key, load) or {}


def _mmse_row(a):
    if a.get("status") != "done":
        return None
    total = a.get("adjustedScore") if a.get("adjustedScore") is not None else a.get("totalScore")
    when = a.get("completedAt") or a.get("updatedAt") or a.get("createdAt")
    if total is None or not when:
        return None
    at = _iso(when)
    return {"date": at[:10], "at": at, "total": total, "max": 30, "severity": a.get("severity"),
            "sections": a.get("sectionScores") or {}}


def mmse(*ids):
    """MMSE totals over time: [{date, at, total, max, severity, sections}] oldest first."""
    rows = _by_patient("mmse", "assessments", {"patientId": 1, "status": 1, "totalScore": 1, "adjustedScore": 1,
                                                "severity": 1, "sectionScores": 1, "completedAt": 1,
                                                "updatedAt": 1, "createdAt": 1}, _mmse_row)
    return sorted((r for i in set(ids) if i for r in rows.get(i, [])), key=lambda x: x["at"])


def _game_row(g):
    tot = g.get("totalAnswers") or g.get("maxScore")
    ok = g.get("correctAnswers") if g.get("totalAnswers") else g.get("score")
    when = _iso(g.get("completedAt") or g.get("createdAt"))[:10]
    if not when or not tot or ok is None:
        return None
    return {"date": when, "ok": ok, "tot": tot, "game": g.get("gameId") or "game"}


def games(*ids):
    """Cognitive game accuracy per day: [{date, accuracy (0-100), sessions, games}] oldest first."""
    rows = _by_patient("games", "game_sessions", {"patientId": 1, "gameId": 1, "correctAnswers": 1, "totalAnswers": 1,
                                                  "score": 1, "maxScore": 1, "completedAt": 1, "createdAt": 1}, _game_row)
    days = {}
    for r in (r for i in set(ids) if i for r in rows.get(i, [])):
        d = days.setdefault(r["date"], {"ok": 0, "tot": 0, "sessions": 0, "games": set()})
        d["ok"] += r["ok"]
        d["tot"] += r["tot"]
        d["sessions"] += 1
        d["games"].add(r["game"])
    return [{"date": k, "accuracy": round(100 * v["ok"] / v["tot"], 1), "sessions": v["sessions"],
             "games": sorted(v["games"])} for k, v in sorted(days.items())]


def severity(*ids):
    """Latest monitor / escalate triage of the severity component, or None."""
    rows = _by_patient("severity", "severity_predictions", {"patientId": 1, "triage": 1, "confidence": 1,
                                                            "message": 1, "createdAt": 1},
                       lambda s: {"triage": s.get("triage"), "confidence": s.get("confidence"),
                                  "message": s.get("message"), "at": _iso(s.get("createdAt"))})
    found = sorted((r for i in set(ids) if i for r in rows.get(i, [])), key=lambda x: x["at"])
    if not found:
        return None
    last = found[-1]
    return {**{k: v for k, v in last.items() if k != "at"}, "date": last["at"][:10]}


def ids_for(pid):
    """Every id the patient's data may be stored under."""
    p = find_patient(pid)
    return [i for i in {pid, *(p and (p["care_id"], p["user_id"]) or ())} if i]


def age_days(iso_date):
    try:
        return (datetime.date.today() - datetime.date.fromisoformat(iso_date[:10])).days
    except Exception:
        return None
