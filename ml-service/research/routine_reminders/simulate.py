"""
Sensor-free adaptive medication reminders - simulation study.

Question: without home sensors, can reminders that learn from the patient's own
"done" taps, check how far those taps can be trusted, and learn which reminder
style works for each person, cut missed medicine doses compared with a fixed
alarm and with the current rule-based reminder?

Data
  * Routine timing: CASAS smart-home "labeled" data (Washington State University,
    Zenodo record 15708568, CC-BY-4.0) - real first times of Morning_Meds /
    Evening_Meds / Take_Medicine per day in 10 older adults' homes.
  * Patients: the 15 elder-home profiles (dementia_patients_data.csv: memory,
    mobility, aggression, Parkinson's ...) + 85 virtual patients resampled from
    them = 100. Only the behaviour categories are used, never names.
  * Behaviour parameters (how often a dose is forgotten, false "done" taps, which
    reminder style works) are stated assumptions - see ASSUMPTIONS below and the
    sensitivity run (--sensitivity).

Strategies compared (same random draws for every strategy = a paired design)
  A  fixed     one alarm at the prescribed time every day
  B  routine   the current system: learns the usual time from "done" taps,
               reminds once at usual + 30 min if no tap yet, trusts every tap
  C  adaptive  ours: B's routine learning + risk-based grace time + Thompson
               sampling over 9 reminder styles + trust model for taps
               (low trust -> asks the caregiver to check) + one follow-up
               + caregiver alert
  B+escalate   B plus C's follow-up reminder and caregiver alert, but none of the
               AI parts - so C vs B+escalate isolates what the AI adds
  C-noTrust    ablation: C but every tap is trusted
  C-noBandit   ablation: C but always the same reminder style

Run:  python simulate.py --casas <folder with hhNNN.csv files>
      (first run extracts casas_routines.json; later runs can skip --casas)
"""
import argparse
import csv
import json
import math
import os
import re
from collections import defaultdict

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROFILES_CSV = os.path.join(HERE, "..", "..", "memory-service", "dataset", "dementia_patients_data.csv")
ROUTINES_JSON = os.path.join(HERE, "casas_routines.json")
OUT = os.path.join(HERE, "results")

N_PATIENTS = 100
DAYS = 90
TASKS = ["med_morning", "med_evening"]
STRATEGIES = ["A fixed", "B routine", "B+escalate", "C adaptive", "C-noTrust", "C-noBandit"]
LEADS = [-10, 0, 10]                          # minutes before / at / after the expected time
MODES = ["text", "ai_voice", "family_voice"]
ARMS = [(l, m) for l in LEADS for m in MODES]

# ─── ASSUMPTIONS (behaviour model) ──────────────────────────────────────────
ASSUMPTIONS = {
    "forget_base": {"Severe": 0.40, "Moderate": 0.25, "Mild": 0.12},   # P(dose forgotten without a reminder)
    "progression": 0.30,          # forgetting grows by 30 % (relative) over the 90 days
    "missed_yesterday_bonus": 0.10,
    "false_done": {"Severe": 0.30, "Moderate": 0.15, "Mild": 0.05},     # P(taps "done" although not done)
    "tap_when_done": 0.85,        # P(taps "done" after really taking it); Parkinson's x0.8
    "response_base": 0.55,        # P(acts on a reminder) before style effects
    "family_voice_bonus": 0.20,   # memory loss: a familiar voice helps
    "ai_voice_bonus": 0.10,
    "text_penalty_severe": 0.15,
    "voice_penalty_aggression": 0.15,
    "matched_lead_bonus": 0.10,   # each patient has a hidden best timing
    "random_caregiver_check": 0.30,   # P(caregiver happens to verify a dose)
    "caregiver_answers": 0.90,    # P(caregiver answers a check request)
    "caregiver_fixes": 0.70,      # P(dose given after a caregiver alert)
}


# ─── CASAS routines ─────────────────────────────────────────────────────────
def extract_casas(folder):
    """First time per day of each medicine activity, per home (minutes after midnight)."""
    homes = {}
    for name in sorted(os.listdir(folder)):
        if not re.match(r"hh\d+\.csv$", name):
            continue
        firsts = defaultdict(dict)
        with open(os.path.join(folder, name), encoding="utf-8", errors="replace") as f:
            for line in f:
                m = re.search(r'^(\d{4}-\d\d-\d\d),(\d\d):(\d\d)[^,]*,.*?([A-Za-z_]+)="begin"', line)
                if not m:
                    continue
                day, minute, act = m.group(1), int(m.group(2)) * 60 + int(m.group(3)), m.group(4)
                task = ("med_morning" if act == "Morning_Meds" or (act == "Take_Medicine" and minute < 14 * 60) else
                        "med_evening" if act == "Evening_Meds" or (act == "Take_Medicine" and minute >= 14 * 60) else None)
                if task and day not in firsts[task]:
                    firsts[task][day] = minute
        usable = {t: sorted(v.values()) for t, v in firsts.items() if len(v) >= 10}
        if set(TASKS) <= set(usable):
            homes[name[:-4]] = usable
    json.dump(homes, open(ROUTINES_JSON, "w"), indent=1)
    return homes


# ─── Patients ───────────────────────────────────────────────────────────────
def real_profiles():
    rows = list(csv.DictReader(open(PROFILES_CSV, encoding="utf-8")))
    out = []
    for r in rows:
        cats = r["Key_Categories"].lower()
        text = r["Behaviors_English"].lower()
        severity = "Severe" if "no memory" in text else "Moderate" if ("memory" in cats or "forget" in text) else "Mild"
        out.append({"severity": severity,
                    "aggression": any(k in cats for k in ("aggression", "anger", "abuse", "physical")),
                    "parkinsons": "parkinson" in cats, "real": True})
    return out


def make_patients(rng, homes):
    base = real_profiles()
    pats = [dict(p) for p in base]
    while len(pats) < N_PATIENTS:   # virtual patients: resampled profiles, flags jittered a little
        p = dict(base[rng.integers(len(base))])
        if rng.random() < 0.15:
            p["aggression"] = not p["aggression"]
        p["real"] = False
        pats.append(p)
    home_ids = sorted(homes)
    for i, p in enumerate(pats):
        p["id"] = f"P{i + 1:03d}"
        p["home"] = home_ids[rng.integers(len(home_ids))]
        p["shift"] = int(rng.normal(0, 30))          # this patient's day runs a little earlier/later
        p["best_lead"] = LEADS[rng.integers(3)]      # hidden: the timing that works for them
    return pats


def response_prob(p, arm, A):
    lead, mode = arm
    pr = A["response_base"]
    memory_loss = p["severity"] in ("Severe", "Moderate")
    if mode == "family_voice" and memory_loss:
        pr += A["family_voice_bonus"]
    if mode == "ai_voice":
        pr += A["ai_voice_bonus"]
    if mode == "text" and p["severity"] == "Severe":
        pr -= A["text_penalty_severe"]
    if mode != "text" and p["aggression"]:
        pr -= A["voice_penalty_aggression"]
    pr += A["matched_lead_bonus"] if lead == p["best_lead"] else -0.05
    return float(np.clip(pr, 0.05, 0.95))


# ─── One patient, one task, one strategy ────────────────────────────────────
def draws(seed, days):
    """Every random number the world needs, drawn once so all strategies face the same days."""
    r = np.random.default_rng(seed)
    return {k: r.random(days) for k in ("forget", "tap", "false", "check", "answer", "resp1", "resp2", "fix", "pick")} | \
           {"jitter": r.normal(0, 10, days), "delay": r.uniform(2, 10, days), "tapdelay": r.uniform(0, 5, days)}


def run(p, task, strategy, homes, A, seed):
    rng = np.random.default_rng(seed + 7)          # the strategy's own randomness (Thompson sampling)
    W = draws(seed, DAYS)
    times = homes[p["home"]][task]
    prescribed = round((float(np.median(times)) + p["shift"]) / 30) * 30
    adaptive = strategy.startswith("C")            # risk-based grace time
    escalate = adaptive or strategy == "B+escalate"  # follow-up reminder + caregiver alert
    use_trust = strategy in ("C adaptive", "C-noBandit")
    use_bandit = strategy in ("C adaptive", "C-noTrust")
    alpha = np.ones(len(ARMS))
    beta = np.ones(len(ARMS))
    trust_a, trust_b = 2.0, 1.0                    # prior: taps are mostly honest
    tap_times, recent_miss = [], []
    stats = defaultdict(float)
    weekly = defaultdict(lambda: [0, 0])
    missed_yesterday = False
    fixed_arm = (0, "ai_voice")

    for d in range(DAYS):
        intended = times[int(W["pick"][d] * len(times))] + p["shift"] + W["jitter"][d]
        prog = 1 + A["progression"] * d / DAYS
        pf = min(0.95, A["forget_base"][p["severity"]] * prog + (A["missed_yesterday_bonus"] if missed_yesterday else 0))
        forgot = W["forget"][d] < pf
        done_at = None if forgot else intended
        tap_p = A["tap_when_done"] * (0.8 if p["parkinsons"] else 1)
        tapped_at = (done_at + W["tapdelay"][d]) if (done_at is not None and W["tap"][d] < tap_p) else None
        false_tap = forgot and W["false"][d] < A["false_done"][p["severity"]]
        if false_tap:
            tapped_at = intended + W["tapdelay"][d]
        reminders = 0

        # When does the strategy look, and what does it believe at that moment?
        if strategy == "A fixed":
            check_at = prescribed
        else:
            usual = float(np.median(tap_times[-14:])) if len(tap_times) >= 3 else prescribed
            risk = (sum(recent_miss[-7:]) / max(1, len(recent_miss[-7:]))) if adaptive else 0
            grace = 15 if (adaptive and (risk > 0.3 or p["severity"] == "Severe")) else 30
            check_at = usual + grace
        believed_done = False
        if strategy != "A fixed" and tapped_at is not None and tapped_at <= check_at:
            if use_trust and trust_a / (trust_a + trust_b) < 0.8:
                stats["checks"] += 1               # unsure about this tap -> ask the caregiver
                if W["answer"][d] < A["caregiver_answers"]:
                    believed_done = done_at is not None
                    trust_a, trust_b = (trust_a + 1, trust_b) if done_at is not None else (trust_a, trust_b + 1)
                else:
                    believed_done = True
            else:
                believed_done = True

        def remind(at, draw):
            nonlocal done_at, reminders
            if use_bandit:
                arm_i = int(np.argmax(rng.beta(alpha, beta)))
            else:
                arm_i = ARMS.index(fixed_arm)
            arm = ARMS[arm_i]
            at = at + arm[0]
            reminders += 1
            already = done_at is not None and done_at <= at
            if already:
                stats["unnecessary"] += 1
            acted = (not already) and draw < response_prob(p, arm, A)
            if acted:
                done_at = at + W["delay"][d]
            if use_bandit and not already:
                alpha[arm_i] += acted
                beta[arm_i] += not acted
            return acted

        if not believed_done:
            acted = remind(check_at, W["resp1"][d])
            if escalate and not acted and done_at is None:
                if not remind(check_at + 30, W["resp2"][d]):   # follow-up, then the caregiver
                    stats["caregiver_alerts"] += 1
                    if done_at is None and W["fix"][d] < A["caregiver_fixes"]:
                        done_at = check_at + 60
        if strategy != "A fixed" and believed_done and done_at is None:
            stats["false_done"] += 1               # the system thought it was taken; it was not

        # Random caregiver checks also teach the trust model (only C uses it).
        if use_trust and tapped_at is not None and W["check"][d] < A["random_caregiver_check"]:
            trust_a, trust_b = (trust_a + 1, trust_b) if not false_tap else (trust_a, trust_b + 1)

        missed = done_at is None
        missed_yesterday = missed
        recent_miss.append(missed)
        if tapped_at is not None or (done_at is not None and not forgot):
            tap_times.append(tapped_at if tapped_at is not None else done_at)
        stats["missed"] += missed
        stats["reminders"] += reminders
        weekly[d // 7][0] += missed
        weekly[d // 7][1] += 1
    return stats, weekly


# ─── Experiment ─────────────────────────────────────────────────────────────
def experiment(homes, A, seed=42):
    rng = np.random.default_rng(seed)
    pats = make_patients(rng, homes)
    rows, weekly_all = [], defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for pi, p in enumerate(pats):
        for ti, task in enumerate(TASKS):
            s_seed = seed * 1000 + pi * 10 + ti
            for strat in STRATEGIES:
                st, wk = run(p, task, strat, homes, A, s_seed)
                rows.append({"patient": p["id"], "real": p["real"], "severity": p["severity"],
                             "aggression": p["aggression"], "task": task, "strategy": strat,
                             "missed_rate": st["missed"] / DAYS, "reminders_per_day": st["reminders"] / DAYS,
                             "unnecessary_per_day": st["unnecessary"] / DAYS, "false_done_rate": st["false_done"] / DAYS,
                             "checks_per_week": st["checks"] / DAYS * 7, "alerts_per_week": st["caregiver_alerts"] / DAYS * 7})
                for w, (m, n) in wk.items():
                    weekly_all[strat][w][0] += m
                    weekly_all[strat][w][1] += n
    return pats, rows, weekly_all


def per_patient(rows, metric):
    by = defaultdict(lambda: defaultdict(list))
    for r in rows:
        by[r["strategy"]][r["patient"]].append(r[metric])
    return {s: {pid: float(np.mean(v)) for pid, v in d.items()} for s, d in by.items()}


def summarise(rows):
    from scipy.stats import wilcoxon
    out = []
    pp = {m: per_patient(rows, m) for m in ("missed_rate", "reminders_per_day", "unnecessary_per_day",
                                             "false_done_rate", "checks_per_week", "alerts_per_week")}
    ids = sorted(pp["missed_rate"]["A fixed"])
    for s in STRATEGIES:
        vals = np.array([pp["missed_rate"][s][i] for i in ids])
        boot = np.random.default_rng(0).choice(vals, (2000, len(vals))).mean(1)
        row = {"strategy": s, "missed_%": 100 * vals.mean(),
               "ci_low": 100 * np.percentile(boot, 2.5), "ci_high": 100 * np.percentile(boot, 97.5)}
        for m in ("reminders_per_day", "unnecessary_per_day", "false_done_rate", "checks_per_week", "alerts_per_week"):
            row[m] = float(np.mean([pp[m][s][i] for i in ids]))
        out.append(row)
    for label, keep in (("real 15", lambda r: r["real"]), ("virtual 85", lambda r: not r["real"])):
        sub = [r for r in rows if keep(r)]
        for s in STRATEGIES:
            out.append({"strategy": f"{s} [{label}]",
                        "missed_%": 100 * float(np.mean([r["missed_rate"] for r in sub if r["strategy"] == s])),
                        "ci_low": "", "ci_high": "", "reminders_per_day": "", "unnecessary_per_day": "",
                        "false_done_rate": "", "checks_per_week": "", "alerts_per_week": ""})
    tests = []
    ours = np.array([pp["missed_rate"]["C adaptive"][i] for i in ids])
    for s in STRATEGIES:
        if s == "C adaptive":
            continue
        other = np.array([pp["missed_rate"][s][i] for i in ids])
        stat, pval = wilcoxon(ours, other)
        tests.append({"vs": s, "mean_diff_points": 100 * float((ours - other).mean()), "wilcoxon_p": float(pval),
                      "patients_better": int((ours < other).sum()), "patients_worse": int((ours > other).sum())})
    return out, tests


def by_group(rows, key):
    g = defaultdict(lambda: defaultdict(list))
    for r in rows:
        g[r[key]][r["strategy"]].append(r["missed_rate"])
    return {k: {s: 100 * float(np.mean(v)) for s, v in d.items()} for k, d in g.items()}


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--casas", help="folder with CASAS labeled hhNNN.csv files (first run)")
    ap.add_argument("--sensitivity", action="store_true", help="also rerun with pessimistic/optimistic assumptions")
    a = ap.parse_args()
    homes = extract_casas(a.casas) if a.casas else json.load(open(ROUTINES_JSON))
    os.makedirs(OUT, exist_ok=True)
    print(f"CASAS homes with morning+evening medicine times: {len(homes)}")
    for h, t in homes.items():
        print(f"  {h}: morning n={len(t['med_morning'])} median {int(np.median(t['med_morning'])) // 60}:{int(np.median(t['med_morning'])) % 60:02d}"
              f" | evening n={len(t['med_evening'])} median {int(np.median(t['med_evening'])) // 60}:{int(np.median(t['med_evening'])) % 60:02d}")

    pats, rows, weekly = experiment(homes, ASSUMPTIONS)
    summary, tests = summarise(rows)
    write_csv(os.path.join(OUT, "per_patient.csv"), rows)
    write_csv(os.path.join(OUT, "summary.csv"), summary)
    write_csv(os.path.join(OUT, "tests.csv"), tests)
    sev, agg = by_group(rows, "severity"), by_group(rows, "aggression")
    wk = {s: [100 * weekly[s][w][0] / weekly[s][w][1] for w in sorted(weekly[s])] for s in STRATEGIES}
    json.dump({"severity": sev, "aggression": agg, "weekly_missed_%": wk,
               "patients": {"real": sum(p["real"] for p in pats), "virtual": sum(not p["real"] for p in pats),
                            "severity_counts": {k: sum(p["severity"] == k for p in pats) for k in ("Severe", "Moderate", "Mild")}},
               "assumptions": ASSUMPTIONS}, open(os.path.join(OUT, "groups.json"), "w"), indent=1)

    print(f"\n{len(pats)} patients x {DAYS} days x {len(TASKS)} doses/day, {len(STRATEGIES)} strategies")
    print(f"{'strategy':<12} {'missed %':>9} {'95% CI':>15} {'rem/day':>8} {'unneeded':>9} {'false-done':>11} {'checks/wk':>10} {'alerts/wk':>10}")
    for r in summary:
        if "[" in r["strategy"]:
            continue
        print(f"{r['strategy']:<12} {r['missed_%']:>9.1f} {r['ci_low']:>7.1f}-{r['ci_high']:<6.1f} {r['reminders_per_day']:>8.2f} "
              f"{r['unnecessary_per_day']:>9.2f} {100 * r['false_done_rate']:>10.1f}% {r['checks_per_week']:>10.2f} {r['alerts_per_week']:>10.2f}")
    print("\nC adaptive vs others (paired Wilcoxon over patients):")
    for t in tests:
        print(f"  vs {t['vs']:<11} {t['mean_diff_points']:+.1f} points  p={t['wilcoxon_p']:.2e}  better for {t['patients_better']}, worse for {t['patients_worse']}")
    print("\nmissed % for the 15 real profiles vs the 85 virtual ones:")
    for r in summary:
        if "[" in r["strategy"]:
            print(f"  {r['strategy']:<24} {r['missed_%']:.1f}")
    print("\nmissed % by severity:")
    for k in ("Severe", "Moderate", "Mild"):
        if k in sev:
            print(f"  {k:<9}", "  ".join(f"{s.split()[0]}={sev[k][s]:.1f}" for s in STRATEGIES))

    if a.sensitivity:
        print("\nsensitivity (missed % of C adaptive vs A fixed vs B routine):")
        for name, scale in (("pessimistic", 1.3), ("optimistic", 0.7)):
            A2 = json.loads(json.dumps(ASSUMPTIONS))
            A2["forget_base"] = {k: min(0.9, v * scale) for k, v in A2["forget_base"].items()}
            A2["false_done"] = {k: min(0.9, v * scale) for k, v in A2["false_done"].items()}
            A2["response_base"] = A2["response_base"] / scale if scale > 1 else min(0.8, A2["response_base"] / scale)
            _, rows2, _ = experiment(homes, A2, seed=43)
            s2, _ = summarise(rows2)
            print(f"  {name:<12}", "  ".join(f"{r['strategy'].split()[0]}={r['missed_%']:.1f}" for r in s2 if "[" not in r["strategy"]))


if __name__ == "__main__":
    main()
