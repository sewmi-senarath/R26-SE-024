"""
Demo history for the AI reminders (routine_ai.py), so a viva / demo can show what the
method learns after two weeks of use instead of an empty, untrained screen.

It writes 14 past days of reminders, patient taps and caregiver answers for ONE patient:
  * morning medicine set at 08:00, really taken around 08:20  -> learned usual time
  * evening medicine set at 20:00, really around 20:40, missed on 3 of the last 7 days
                                                               -> high risk, 15-min grace
  * breakfast / lunch / dinner / water                         -> other routines learned
  * the patient tapped "Done" 5 times when the caregiver later said "not given"
                                                               -> trust ~0.6 < 0.8, so a
                                                                  new "Done" asks the caregiver
  * the patient acted most often on the daughter's voice       -> Thompson sampling prefers
                                                                  "family voice"

Clearly synthetic demo data: every event has "demo": true. Run it in the memory-service
folder while the AI service is STOPPED (it rewrites routine_ai_db.json):

    python ../research/demo/seed_routine_demo.py <patient_id> [--reset]
"""
import os
import random
import sys

sys.path.insert(0, os.getcwd())
import routine_ai as ra  # noqa: E402
import sltime as datetime  # noqa: E402

random.seed(7)
pid = sys.argv[1]
ra._load()
if "--reset" in sys.argv or pid not in ra.STATE:
    ra.STATE.pop(pid, None)
st = ra._patient(pid)

ROUTINES = {   # task: (set time, real mean minutes, spread, chance missed per day)
    "med_morning": ("08:00", 8 * 60 + 20, 8, 0.10),
    "med_evening": ("20:00", 20 * 60 + 40, 12, 0.30),
    "breakfast":   ("07:30", 7 * 60 + 45, 10, 0.05),
    "lunch":       ("12:30", 12 * 60 + 50, 12, 0.05),
    "dinner":      ("19:30", 19 * 60 + 30, 10, 0.10),
    "water@09:00": ("09:00", 9 * 60 + 15, 15, 0.20),
}
for task, (t, *_rest) in ROUTINES.items():
    kind = task.split("@")[0]
    c = ra.CATALOG[kind]
    st["tasks"][task] = {"kind": kind, "cat": c["cat"], "time": t, "si": c["si"], "en": c["en"]}

FAMILY_GOOD = {"0|family_voice": 0.85, "10|family_voice": 0.75, "0|ai_voice": 0.55, "-10|ai_voice": 0.45}
today = datetime.date.today()
false_taps = 0
for back in range(14, 0, -1):
    day = today - datetime.timedelta(days=back)
    dk = day.isoformat()
    for task, (t, mean, spread, p_miss) in ROUTINES.items():
        arm = random.choice(ra.ARMS)
        acted = random.random() < FAMILY_GOOD.get(arm, 0.35)
        ra._reward(st, task, arm, acted)
        h, m = map(int, t.split(":"))
        r_at = datetime.datetime.combine(day, datetime.time(h, m)) + datetime.timedelta(minutes=30)
        st["events"].append({"type": "reminder", "task": task, "arm": arm, "demo": True,
                             "at": r_at.isoformat(timespec="seconds")})
        missed = random.random() < p_miss
        taken = int(random.gauss(mean, spread))
        at = datetime.datetime.combine(day, datetime.time(taken // 60 % 24, taken % 60)).isoformat(timespec="seconds")
        state = {"done": not missed, "reminders": [{"id": "demo", "arm": arm, "at": r_at.isoformat(timespec="seconds"),
                                                    "answered": True}], "check": None, "alert": missed}
        if missed and task.startswith("med") and false_taps < 5:
            false_taps += 1   # tapped "Done" without taking it - the caregiver caught it
            st["events"].append({"type": "done", "task": task, "source": "patient", "accepted": False, "demo": True, "at": at})
            st["events"].append({"type": "not_done", "task": task, "source": "caregiver", "accepted": False, "demo": True, "at": at})
            st["trust"][1] += 1
        elif not missed:
            st["events"].append({"type": "done", "task": task, "source": "patient", "accepted": True, "demo": True, "at": at})
            if task.startswith("med"):
                st["events"].append({"type": "done", "task": task, "source": "caregiver", "accepted": True, "demo": True, "at": at})
                st["trust"][0] += 0.5
        else:
            st["events"].append({"type": "caregiver_alert", "task": task, "demo": True, "at": at})
        st["today"].setdefault(dk, {})[task] = state

st["events"].sort(key=lambda e: e["at"])
ra._save()
o = ra.overview(pid, "en")
print("trust:", round(ra._trust(st), 2), "(below 0.8 -> caregiver check)")
for t in o.get("tasks", []):
    print(f"  {t['en']:<20} set {t['set_time']}  learned {t['usual']} ({t['days_learned']} days)  "
          f"risk {t['risk']:.2f}  best style {t.get('best_style')}")
