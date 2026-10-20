"""
Bring one patient's memory data saved on another AI server (e.g. a laptop used for
testing) into this server's data, without losing what is already here.

    python import_patient_data.py <folder with the other server's *_db.json> <patient_id>

Run in the memory-service folder while the AI service is STOPPED. For things seen on both
servers the newer sighting wins; moments, people and conversations are joined (by id).
A copy of every changed file is kept as <file>.before-import-<time>.
"""
import copy
import glob
import json
import os
import shutil
import sys
import time

src_dir, pid = sys.argv[1], sys.argv[2]
stamp = time.strftime("%Y%m%d-%H%M%S")


def key_of(x):
    return x.get("id") or x.get("time") or json.dumps(x, sort_keys=True, ensure_ascii=False) if isinstance(x, dict) else json.dumps(x)


def merge(here, other):
    """Join two values of the same patient: newer 'time' wins for records, lists joined by id."""
    if isinstance(here, list) and isinstance(other, list):
        seen = {key_of(x) for x in here}
        out = list(here) + [copy.deepcopy(x) for x in other if key_of(x) not in seen]
        if out and all(isinstance(x, dict) and "time" in x for x in out):
            out.sort(key=lambda x: x["time"])
        return out
    if isinstance(here, dict) and isinstance(other, dict):
        if "time" in here and "time" in other and isinstance(here["time"], str):
            return copy.deepcopy(other) if other["time"] > here["time"] else here
        out = dict(here)
        for k, v in other.items():
            out[k] = merge(out[k], v) if k in out else copy.deepcopy(v)
        return out
    return here


def walk(here, other):
    """Find every place keyed by the patient id and merge the other server's entry into it."""
    changed = 0
    if isinstance(here, dict) and isinstance(other, dict):
        if pid in other:
            here[pid] = merge(here[pid], other[pid]) if pid in here else copy.deepcopy(other[pid])
            changed += 1
        for k in here:
            if k != pid and k in other:
                changed += walk(here[k], other[k])
    return changed


for f in sorted(glob.glob("*_db.json")):
    theirs = os.path.join(src_dir, f)
    if not os.path.exists(theirs):
        continue
    ours = json.load(open(f, encoding="utf-8"))
    n = walk(ours, json.load(open(theirs, encoding="utf-8")))
    if n:
        shutil.copy2(f, f"{f}.before-import-{stamp}")
        json.dump(ours, open(f, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{f:28s} {n} parts merged")
