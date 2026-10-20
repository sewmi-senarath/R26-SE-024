"""
Family-face recognition accuracy: old rule vs. the new rule, on the real enrolment photos.

Every enrolment photo is held out in turn and matched against everybody's gallery
(its own person keeps their other photos) - leave-one-out over FaceNet embeddings
already stored by the app, so no face images leave the server.

  old rule : nearest view, greet if cosine >= 0.65
  new rule : greet only if cosine >= 0.72, agrees with the enrolment photos (>= 0.60)
             and beats the next family member by >= 0.08 - otherwise ASK "who is this?"

Impostor test: each person is removed from the gallery entirely and their photos are
shown to the others - a correct system says ASK, never another relative's name.

    python eval_faces.py ../../memory-service/moments_db.json [--out results.json]
"""
import json
import sys

import numpy as np

OLD_MATCH = 0.65
NEW_MATCH, MARGIN, ANCHOR = 0.72, 0.08, 0.60


def unit(v):
    v = np.asarray(v, dtype=np.float32)
    return v / (np.linalg.norm(v) + 1e-9)


def load_families(path):
    """One gallery per patient, as the app matches (a face is only compared with that
    patient's own family). Enrolled people only - the caregiver's enrolment photos are
    the ground truth. A family that is a copy of another patient's is counted once."""
    families = []
    for plist in json.load(open(path, encoding="utf-8"))["PEOPLE"].values():
        fam = {}
        for p in plist:
            photos = p.get("anchors") or p.get("embeddings", [])
            if p.get("enrolled") and len(photos) >= 2:
                fam[p["id"]] = [unit(e) for e in photos]
        if fam and not any(set(fam) <= set(f) for f in families):
            families = [f for f in families if not set(f) <= set(fam)] + [fam]
    return families


def decide(query, gallery, rule):
    """gallery: {id: [views]} -> predicted id or None (= ask)."""
    scored = sorted(((max(float(query @ g) for g in views), pid) for pid, views in gallery.items() if views), reverse=True)
    if not scored:
        return None
    best, pid = scored[0]
    if rule == "old":
        return pid if best >= OLD_MATCH else None
    second = scored[1][0] if len(scored) > 1 else 0.0
    return pid if best >= NEW_MATCH and best >= ANCHOR and best - second >= MARGIN else None


def evaluate(families):
    out = {}
    for rule in ("old", "new"):
        known = {"correct": 0, "ask": 0, "wrong": 0}
        stranger = {"ask": 0, "wrong": 0}
        for people in families:
            _score(people, rule, known, stranger)
        n, m = sum(known.values()), sum(stranger.values())
        out[rule] = {
            "known_faces": known, "unregistered_faces": stranger,
            "accuracy_known": round(known["correct"] / n, 3) if n else None,
            "wrong_name_rate_known": round(known["wrong"] / n, 3) if n else None,
            "false_accept_rate_strangers": round(stranger["wrong"] / m, 3) if m else None,
        }
    genuine = [float(a @ b) for f in families for v in f.values() for i, a in enumerate(v) for b in v[i + 1:]]
    impostor = [float(a @ b) for f in families for i, x in enumerate(list(f)) for y in list(f)[i + 1:]
                for a in f[x] for b in f[y]]
    out["similarity"] = {
        "genuine_mean": round(float(np.mean(genuine)), 3) if genuine else None,
        "genuine_min": round(float(np.min(genuine)), 3) if genuine else None,
        "impostor_mean": round(float(np.mean(impostor)), 3) if impostor else None,
        "impostor_max": round(float(np.max(impostor)), 3) if impostor else None,
    }
    out["families"] = len(families)
    out["people"] = sum(len(f) for f in families)
    out["photos"] = sum(len(v) for f in families for v in f.values())
    return out


def _score(people, rule, known, stranger):
    for pid, photos in people.items():
        for i, q in enumerate(photos):
            gallery = {k: (v[:i] + v[i + 1:] if k == pid else v) for k, v in people.items()}
            got = decide(q, gallery, rule)
            known["correct" if got == pid else "ask" if got is None else "wrong"] += 1
    for pid, photos in people.items():
        gallery = {k: v for k, v in people.items() if k != pid}
        for q in photos:
            stranger["ask" if decide(q, gallery, rule) is None else "wrong"] += 1


if __name__ == "__main__":
    res = evaluate(load_families(sys.argv[1]))
    print(json.dumps(res, indent=2))
    if "--out" in sys.argv:
        json.dump(res, open(sys.argv[sys.argv.index("--out") + 1], "w"), indent=2)
