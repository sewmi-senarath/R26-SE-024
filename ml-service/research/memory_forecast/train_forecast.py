"""
Memory-score forecast: research, training and evaluation.

Question: from a patient's daily memory-game scores (plus MMSE and cognitive-game
results when they exist), can we estimate the score 4 and 8 weeks ahead, and the risk
of a meaningful decline (>= 5 points in 4 weeks), better than the app's current
rule "average of the last 7 days + 4 x weekly slope"?

Data
  * SIMULATED cohort (clearly simulated - no real patient is in it): 300 patients x 120
    days from a documented generative model (below). Real patients only have days to
    a few weeks of data, far too little to train on.
  * REAL MMSE histories (read-only, team MongoDB) - used only as an external check of
    the trajectory model (leave-last-out), never for training. Skipped without MONGO_URI.

Models
  1. Partial-pooling trajectory (empirical-Bayes random slope, a mixed-effects model):
       slope_i = w_i * own_slope_i + (1 - w_i) * population_slope,
       w_i = tau^2 / (tau^2 + se_i^2)
     A patient with few, noisy days is pulled towards the population; a patient with
     many consistent days keeps their own trend. Level = fitted line at today.
  2. Gradient boosting (scikit-learn) classifier for P(decline >= 5 points in 4 weeks),
     features from the pooled trajectory, noise, adherence, MMSE and cognitive games.

Baseline = the app's current rule (avg7 + 4 * OLS slope over 30 days) and, for risk,
the raw OLS slope.

Evaluation: patient-level split (70 % train / 30 % test, no patient in both), three
forecast origins per patient. MAE of the 4- and 8-week score, AUROC and Brier of risk.

    python train_forecast.py            -> ../../memory-service/forecast_model/memory_forecast.joblib
                                           results.json (metrics)
"""
import json
import os
import sys

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import brier_score_loss, roc_auc_score

HERE = os.path.dirname(os.path.abspath(__file__))
SVC = os.path.join(HERE, "..", "..", "memory-service")
sys.path.insert(0, SVC)
import memory_forecast as mf  # noqa: E402  (the same feature code the service runs)

RNG = np.random.default_rng(26)
N_PATIENTS, N_DAYS = 300, 120
DECLINE = 5.0          # points on the 0-100 memory score within 4 weeks


# ─── Simulated cohort (documented generative model) ──────────────────────────
def simulate_patient(i):
    """Latent memory ability c(t) = baseline + slope * t (+ slow curvature for fast
    decliners). Observed daily score = c(t) + noise, only on days the game is played,
    with occasional bad days. MMSE every ~30 days is a coarse, noisy view of c(t);
    the cognitive games component sees c(t) with its own noise."""
    group = RNG.choice(["stable", "slow", "fast"], p=[0.5, 0.35, 0.15])
    base = float(np.clip(RNG.normal(70, 12), 25, 95))
    slope_w = {"stable": RNG.normal(0.0, 0.4), "slow": RNG.normal(-1.5, 0.5), "fast": RNG.normal(-3.5, 1.0)}[group]
    curve = RNG.normal(-0.01, 0.005) if group == "fast" else 0.0     # per week^2
    noise = RNG.uniform(5, 12)
    play = RNG.uniform(0.45, 0.95)
    t = np.arange(N_DAYS)
    weeks = t / 7
    latent = np.clip(base + slope_w * weeks + curve * weeks ** 2, 0, 100)
    played = RNG.random(N_DAYS) < play
    bad = RNG.random(N_DAYS) < 0.05
    obs = np.clip(latent + RNG.normal(0, noise, N_DAYS) - 15 * bad, 0, 100)
    days = [{"index": int(d), "score": float(round(obs[d], 1))} for d in t if played[d]]
    mm_days = [d for d in range(int(RNG.integers(0, 20)), N_DAYS, int(RNG.integers(25, 40)))]
    mmse = [{"index": d, "total": int(np.clip(round(0.28 * latent[d] + 4 + RNG.normal(0, 1.3)), 0, 30))} for d in mm_days]
    games = [{"index": int(d), "accuracy": float(np.clip(latent[d] + 5 + RNG.normal(0, 10), 0, 100))}
             for d in t if RNG.random() < 0.25]
    return {"id": f"SIM-{i:03d}", "group": str(group), "latent": latent, "days": days, "mmse": mmse, "games": games}


def window(p, origin):
    """History up to and including day `origin`, re-indexed so today = 0."""
    days = [{"index": d["index"] - origin, "score": d["score"]} for d in p["days"] if d["index"] <= origin]
    mmse = [{"index": m["index"] - origin, "total": m["total"]} for m in p["mmse"] if m["index"] <= origin]
    games = [{"index": g["index"] - origin, "accuracy": g["accuracy"]} for g in p["games"] if g["index"] <= origin]
    return days, mmse, games


def truth(p, origin, weeks):
    """Observed-scale truth: mean of the latent ability in the week around origin + weeks."""
    a, b = origin + 7 * weeks - 3, origin + 7 * weeks + 3
    return float(np.mean(p["latent"][a:b + 1]))


def samples(cohort):
    rows = []
    for p in cohort:
        for origin in RNG.choice(np.arange(35, N_DAYS - 60), size=3, replace=False):
            days, mmse, games = window(p, int(origin))
            if len([d for d in days if d["index"] > -30]) < mf.MIN_DAYS:
                continue
            now = float(np.mean(p["latent"][origin - 3:origin + 1]))
            rows.append({"p": p, "origin": int(origin), "days": days, "mmse": mmse, "games": games,
                         "y4": truth(p, origin, 4), "y8": truth(p, origin, 8),
                         "decline": int(truth(p, origin, 4) - now <= -DECLINE)})
    return rows


def baseline(days, weeks):
    """The app's current rule: avg of the last 7 days + weeks x OLS slope (last 30 days)."""
    last7 = [d["score"] for d in days if d["index"] > -7]
    recent = [d for d in days if d["index"] > -30]
    slope = mf.ols(recent)[1] * 7 if len(recent) >= 3 else 0.0
    level = np.mean(last7) if last7 else np.mean([d["score"] for d in recent])
    return float(np.clip(level + weeks * slope, 0, 100)), slope


def main():
    cohort = [simulate_patient(i) for i in range(N_PATIENTS)]
    order = RNG.permutation(N_PATIENTS)
    train_p = [cohort[i] for i in order[:210]]
    test_p = [cohort[i] for i in order[210:]]
    train, test = samples(train_p), samples(test_p)

    # 1. population prior for the random slope, from the training patients only
    prior = mf.fit_prior([r["days"] for r in train])

    # 2. gradient boosting on the pooled-trajectory features
    X = np.array([mf.features(r["days"], r["mmse"], r["games"], prior) for r in train])
    y = np.array([r["decline"] for r in train])
    gb = GradientBoostingClassifier(n_estimators=200, max_depth=3, learning_rate=0.05, subsample=0.8, random_state=26)
    gb.fit(X, y)

    # 3. evaluation on unseen patients
    res = {"base4": [], "base8": [], "pool4": [], "pool8": [], "y": [], "p_gb": [], "s_base": [], "s_pool": []}
    for r in test:
        b4, bslope = baseline(r["days"], 4)
        b8, _ = baseline(r["days"], 8)
        traj = mf.trajectory(r["days"], prior)
        res["base4"].append(abs(b4 - r["y4"]))
        res["base8"].append(abs(b8 - r["y8"]))
        res["pool4"].append(abs(traj["w4"] - r["y4"]))
        res["pool8"].append(abs(traj["w8"] - r["y8"]))
        res["y"].append(r["decline"])
        res["s_base"].append(-bslope)
        res["s_pool"].append(-traj["slope_week"])
        res["p_gb"].append(gb.predict_proba([mf.features(r["days"], r["mmse"], r["games"], prior)])[0, 1])
    y_t = np.array(res["y"])
    metrics = {
        "data": {"simulated_patients": N_PATIENTS, "days": N_DAYS, "train_patients": len(train_p),
                 "test_patients": len(test_p), "train_samples": len(train), "test_samples": len(test),
                 "decline_rate_test": round(float(y_t.mean()), 3), "note": "simulated cohort - no real patient data"},
        "mae_4w": {"baseline_avg7_plus_slope": round(float(np.mean(res["base4"])), 2),
                   "partial_pooling": round(float(np.mean(res["pool4"])), 2)},
        "mae_8w": {"baseline_avg7_plus_slope": round(float(np.mean(res["base8"])), 2),
                   "partial_pooling": round(float(np.mean(res["pool8"])), 2)},
        "auroc_decline_4w": {"baseline_raw_slope": round(float(roc_auc_score(y_t, res["s_base"])), 3),
                             "pooled_slope": round(float(roc_auc_score(y_t, res["s_pool"])), 3),
                             "gradient_boosting": round(float(roc_auc_score(y_t, res["p_gb"])), 3)},
        "brier_gradient_boosting": round(float(brier_score_loss(y_t, res["p_gb"])), 3),
        "prior": prior,
        "feature_importance": dict(sorted(zip(mf.FEATURES, (round(float(v), 3) for v in gb.feature_importances_)),
                                          key=lambda kv: -kv[1])),
    }
    metrics["real_mmse_check"] = real_mmse_check()

    os.makedirs(os.path.join(SVC, "forecast_model"), exist_ok=True)
    import joblib
    joblib.dump({"gb": gb, "prior": prior, "features": mf.FEATURES, "version": 1,
                 "metrics": {k: metrics[k] for k in ("mae_4w", "mae_8w", "auroc_decline_4w", "brier_gradient_boosting")},
                 "trained_on": "simulated cohort (300 x 120 days)"},
                os.path.join(SVC, "forecast_model", "memory_forecast.joblib"))
    json.dump({"prior": prior, "metrics": {k: metrics[k] for k in ("mae_4w", "mae_8w", "auroc_decline_4w")},
               "trained_on": "simulated cohort (300 x 120 days)"},
              open(os.path.join(SVC, "forecast_model", "prior.json"), "w"), indent=2)
    json.dump(metrics, open(os.path.join(HERE, "results.json"), "w"), indent=2)
    print(json.dumps(metrics, indent=2))


def real_mmse_check():
    """External check on REAL MMSE histories (read-only): predict each patient's last
    MMSE from the earlier ones - last value vs linear trend vs partially pooled trend."""
    try:
        import team_data
    except Exception:
        return {"status": "skipped"}
    if not team_data.available():
        return {"status": "skipped", "reason": "MONGO_URI not set"}
    hist = []
    for p in team_data.patients():
        m = team_data.mmse(p["care_id"], p["user_id"])
        if len(m) >= 3:
            t0 = np.datetime64(m[0]["date"])
            hist.append([{"index": int((np.datetime64(x["date"]) - t0).astype(int)), "score": float(x["total"])} for x in m])
    if len(hist) < 2:
        return {"status": "too_few", "patients_with_3plus_mmse": len(hist)}
    errs = {"last_value": [], "linear_trend": [], "partial_pooling": []}
    for i, h in enumerate(hist):
        past, last = h[:-1], h[-1]
        gap = last["index"] - past[-1]["index"]
        others = [x for j, x in enumerate(hist) if j != i]           # leave this patient out of the prior
        prior = mf.fit_prior([[{"index": d["index"] - o[-1]["index"], "score": d["score"]} for d in o] for o in others],
                             min_points=2)
        shifted = [{"index": d["index"] - past[-1]["index"], "score": d["score"]} for d in past]
        a, b = mf.ols(shifted)
        tr = mf.trajectory(shifted, prior, min_days=2)
        errs["last_value"].append(abs(past[-1]["score"] - last["score"]))
        errs["linear_trend"].append(abs(float(np.clip(a + b * gap, 0, 30)) - last["score"]))
        errs["partial_pooling"].append(abs(float(np.clip(tr["level"] + tr["slope_week"] * gap / 7, 0, 30)) - last["score"]))
    return {"status": "ok", "patients": len(hist), "mae_mmse_points": {k: round(float(np.mean(v)), 2) for k, v in errs.items()},
            "note": "real MMSE, leave-last-out; small n - indicative only"}


if __name__ == "__main__":
    main()
