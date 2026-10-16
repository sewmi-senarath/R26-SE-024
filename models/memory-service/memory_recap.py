# -*- coding: utf-8 -*-
"""
Weekly, monthly and yearly memory - the daily story's bigger brothers.

A period's memory keeps what matters and drops the rest, the way a person
remembers a week: who came (and how often), what they talked about and
promised, where the important things usually were, how the memory game went,
and the best photos. The facts are counted here; the LLM only joins ready
sentences into a short story in the patient's language (Sinhala or English).

GET /memory-recap/{patient_id}?period=week|month|year&lang=si|en[&date=YYYY-MM-DD][&refresh=1]
"""
import datetime
from collections import Counter, defaultdict

from fastapi import APIRouter

import memory_quiz
import remember_moments as rm
import visit_talk

router = APIRouter()
CACHE = {}   # (pid, period, start, lang) -> recap (memory only; rebuilt after a restart)

MONTHS_SI = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්",
             "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"]
TITLE = {"week": ("මේ සතියේ මතක", "This week's memories"), "month": ("මේ මාසේ මතක", "This month's memories"),
         "year": ("මේ අවුරුද්දේ මතක", "This year's memories")}
EMPTY = {"si": "මේ කාලයේ තවම මතක සටහන් නැහැ. කැමරාවෙන් ඔයාගේ දවස් පෙන්වන්න.",
         "en": "No memories saved in this period yet."}


def _range(period, date):
    d = datetime.date.fromisoformat(date) if date else datetime.date.today()
    if period == "week":
        return d - datetime.timedelta(days=6), d
    if period == "month":
        start = d.replace(day=1)
        nxt = (start + datetime.timedelta(days=32)).replace(day=1)
        return start, min(d, nxt - datetime.timedelta(days=1))
    return d.replace(month=1, day=1), d


def _label(period, start, end, si):
    if period == "week":
        return (f"{MONTHS_SI[start.month - 1]} {start.day} - {MONTHS_SI[end.month - 1]} {end.day}" if si
                else f"{start.day} {start.strftime('%b')} - {end.day} {end.strftime('%b')}")
    if period == "month":
        return f"{start.year} {MONTHS_SI[start.month - 1]}" if si else start.strftime("%B %Y")
    return str(start.year)


def facts(pid, start, end, si):
    """Counted facts of the period, as ready sentences in the patient's language."""
    s, e = start.isoformat(), end.isoformat()
    in_range = lambda iso: s <= iso[:10] <= e
    people = {p["id"]: p for p in rm.PEOPLE.get(pid, [])}

    # People: on how many different days each one came
    days_with = defaultdict(set)
    for day, recs in rm.INTERACTIONS.get(pid, {}).items():
        if s <= day <= e:
            for r in recs.values():
                if r["kind"] == "person" and r["ref"] in people:
                    days_with[r["ref"]].add(day)
    visitors = sorted(days_with.items(), key=lambda kv: -len(kv[1]))
    lines = []
    for pid_, days in visitors[:5]:
        p = people[pid_]
        name = f" {p['name']}" if p.get("name") and p["name"] != p["relation_si"] else ""
        n = len(days)
        lines.append(f"ඔයාගේ {p['relation_si']}{name} ඔයාව බලන්න " + ("එක දවසක් ආවා." if n == 1 else f"දවස් {n}ක් ආවා.") if si
                     else f"Your {p['relation']}{name} came to see you on {n} day{'s' if n > 1 else ''}.")

    # Conversations: topics and promises
    topics, promises = Counter(), []
    for c in visit_talk.CONVERSATIONS.get(pid, []):
        if not in_range(c["day"]):
            continue
        for t in c.get("topics") or []:
            if t.get("si" if si else "en"):
                topics[t["si" if si else "en"]] += 1
        for pr in c.get("promises") or []:
            promises.append(pr.get("si" if si else "en", ""))
    if topics:
        top = ", ".join(t for t, _ in topics.most_common(3))
        lines.append(f"ඔයාලා කතා කළේ {top} ගැන." if si else f"You talked about {top}.")
    for pr in [x for x in promises if x][:2]:
        lines.append(f"පොරොන්දුවක්: {pr}" if si else f"A promise: {pr}")

    # Important things: the room each one was most often seen in
    moments = [m for m in rm.MOMENTS.get(pid, []) if in_range(m["time"])]
    rooms = defaultdict(Counter)
    for m in moments:
        room = m.get("room_si") if si else (m.get("room") or "").lower()
        for o in m["objects"]:
            if o["label"] in rm.STORY_THINGS and room:
                rooms[o["label"]][room] += 1
    for label, cnt in list(rooms.items())[:4]:
        room, _ = cnt.most_common(1)[0]
        name = rm.si_name(label) if si else label
        lines.append(f"ඔයාගේ {name} ගොඩක් වෙලාවට තිබ්බේ {room}ේ." if si else f"Your {name} was usually in the {room}.")

    # Memory game: how many games, average score
    games = [x for x in memory_quiz._finished(pid) if in_range(x.get("day", x.get("created", "")))]
    if games:
        avg = round(sum(g["score"] for g in games) / len(games))
        lines.append(("ඔයා මතක සෙල්ලම එක පාරක් සෙල්ලම් කළා" if len(games) == 1 else f"ඔයා මතක සෙල්ලම {len(games)} පාරක් සෙල්ලම් කළා")
                     + f", ලකුණු {avg}%." if si
                     else f"You played the memory game {len(games)} times, scoring {avg}% on average.")

    day_count = len({m["time"][:10] for m in moments} | {d for ds in days_with.values() for d in ds})
    photos = [p["photo_url"] for p_id, _ in visitors for p in [people[p_id]] if p.get("photo_url")][:3]
    per_day = {}
    for m in moments:                       # one photo per day, newest days last
        per_day.setdefault(m["time"][:10], m["photo_urls"][0] if m.get("photo_urls") else None)
    photos += [u for u in per_day.values() if u][: 8 - len(photos)]
    main = lines[0] if visitors else (lines[0] if lines else "")
    return {"lines": lines, "main": main, "days": day_count, "visitors": len(visitors), "games": len(games),
            "photos": photos}


def build_recap(pid, period, lang="si", date=""):
    si = lang != "en"
    start, end = _range(period, date)
    f = facts(pid, start, end, si)
    title = TITLE[period][0 if si else 1]
    base = {"period": period, "start": start.isoformat(), "end": end.isoformat(), "label": _label(period, start, end, si),
            "title": title, "photos": f["photos"], "days": f["days"], "visitors": f["visitors"], "games": f["games"],
            "lang": lang}
    if not f["lines"]:
        return {**base, "story": EMPTY["si" if si else "en"], "empty": True}
    span = {"week": ("මේ සතිය", "this week"), "month": ("මේ මාසය", "this month"), "year": ("මේ අවුරුද්ද", "this year")}[period]
    story = None
    if rm.GROQ_API_KEY:
        try:
            out = rm._llm_json(
                f"Join the sentences below into a short, warm memory story about {span[1]} for an elderly person with "
                f"dementia, in {'spoken Sinhala (ඔයා, not ඔබ)' if si else 'simple English'}, like a loving grandchild "
                "looking back with them. The sentences are already in the right language: keep their words and "
                "facts, only join them smoothly. Start with the people, then what was talked about, then where "
                "things usually were, then the memory game; finish by saying the most important thing again "
                f"(MAIN). Add nothing new. No quotation marks. 4-7 short, positive sentences. "
                'Reply ONLY with JSON {"story": "..."}.\n\n'
                "Sentences:\n" + "\n".join(f"- {l}" for l in f["lines"]) + f"\n- MAIN: {f['main']}")
            story = out.get("story")
        except Exception as e:
            print("recap LLM failed:", e)
    if not story:
        story = " ".join(f["lines"])
    return {**base, "story": story, "empty": False}


@router.get("/memory-recap/{patient_id}")
async def memory_recap(patient_id: str, period: str = "week", lang: str = "si", date: str = "", refresh: bool = False):
    if period not in ("week", "month", "year"):
        return {"status": "error", "message": "period must be week, month or year"}
    start, _ = _range(period, date)
    key = (patient_id, period, start.isoformat(), lang, datetime.date.today().isoformat())
    if refresh or key not in CACHE:
        CACHE[key] = build_recap(patient_id, period, lang, date)
    return {"status": "success", **CACHE[key]}
