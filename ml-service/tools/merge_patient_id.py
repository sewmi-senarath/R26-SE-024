"""
Move one patient's memory data from an old id to a new one in every memory-service
data file - e.g. when a caregiver creates a care record for a patient who already
used the app: the login then gives the care record's id, and everything saved under
the user id has to follow it.

Run in the memory-service folder while the AI service is STOPPED (it rewrites the
*_db.json files). A copy of every file is kept as <file>.before-merge-<time>.

    python ../tools/merge_patient_id.py <old_id> <new_id>
"""
import glob
import json
import shutil
import sys
import time

old, new = sys.argv[1], sys.argv[2]
stamp = time.strftime("%Y%m%d-%H%M%S")


def merge(a, b):
    """Data under the new id wins; lists are joined, dicts merged."""
    if isinstance(a, list) and isinstance(b, list):
        return a + [x for x in b if x not in a]
    if isinstance(a, dict) and isinstance(b, dict):
        out = dict(a)
        for k, v in b.items():
            out[k] = merge(out[k], v) if k in out else v
        return out
    return b


def walk(x):
    if isinstance(x, dict):
        moved = 0
        if old in x:
            val = x.pop(old)
            x[new] = merge(val, x[new]) if new in x else val
            moved = 1
        for k in list(x):
            if x[k] == old:
                x[k] = new
                moved += 1
            else:
                moved += walk(x[k])
        return moved
    if isinstance(x, list):
        moved = 0
        for i, v in enumerate(x):
            if v == old:
                x[i] = new
                moved += 1
            else:
                moved += walk(v)
        return moved
    return 0


for f in sorted(glob.glob("*_db.json")):
    data = json.load(open(f, encoding="utf-8"))
    n = walk(data)
    if n:
        shutil.copy2(f, f"{f}.before-merge-{stamp}")
        json.dump(data, open(f, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{f:28s} {n} entries moved")
