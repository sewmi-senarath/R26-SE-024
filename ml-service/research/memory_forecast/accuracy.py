"""
Accuracy of the partial-pooling forecast vs the old rule (avg7 + weeks x slope), on the
same unseen simulated patients as train_forecast.py (same seed, same split).

  MAE / RMSE     average error in points (0-100 memory score)
  within 5 / 10  share of forecasts no more than 5 / 10 points off
  coverage       share of true values inside the model's 95% range (should be about 95%)
  95% CI         bootstrap over test patients (1000 resamples)

    python accuracy.py        -> accuracy.json
"""
import json
import os

import numpy as np

import train_forecast as tf
import memory_forecast as mf

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    cohort = [tf.simulate_patient(i) for i in range(tf.N_PATIENTS)]
    order = tf.RNG.permutation(tf.N_PATIENTS)
    train = tf.samples([cohort[i] for i in order[:210]])
    test = tf.samples([cohort[i] for i in order[210:]])
    prior = mf.fit_prior([r["days"] for r in train])

    rows = []
    for r in test:
        t = mf.trajectory(r["days"], prior)
        for w, key, ci in ((4, "w4", "ci4"), (8, "w8", "ci8")):
            y = r[f"y{w}"]
            rows.append({"pid": r["p"]["id"], "weeks": w, "truth": y,
                         "pool": t[key], "base": tf.baseline(r["days"], w)[0],
                         "inside": t[ci][0] <= y <= t[ci][1]})

    rng = np.random.default_rng(1)
    out = {"test_patients": len({x["pid"] for x in rows}), "forecasts_per_horizon": len(rows) // 2,
           "note": "unseen simulated patients, same split as train_forecast.py"}
    for w in (4, 8):
        sub = [x for x in rows if x["weeks"] == w]
        pids = sorted({x["pid"] for x in sub})
        res = {}
        for name in ("pool", "base"):
            err = np.array([abs(x[name] - x["truth"]) for x in sub])
            boot = []
            for _ in range(1000):
                pick = set(rng.choice(pids, len(pids)))
                boot.append(np.mean([abs(x[name] - x["truth"]) for x in sub if x["pid"] in pick]))
            res[name] = {"MAE": round(float(err.mean()), 2),
                         "MAE_95CI": [round(float(np.percentile(boot, 2.5)), 2), round(float(np.percentile(boot, 97.5)), 2)],
                         "RMSE": round(float(np.sqrt((err ** 2).mean())), 2),
                         "within_5": round(float((err <= 5).mean() * 100), 1),
                         "within_10": round(float((err <= 10).mean() * 100), 1)}
        res["pool"]["range_coverage_95"] = round(float(np.mean([x["inside"] for x in sub]) * 100), 1)
        res["error_reduction_%"] = round(100 * (1 - res["pool"]["MAE"] / res["base"]["MAE"]), 1)
        out[f"{w}_weeks"] = {"partial_pooling": res["pool"], "old_rule": res["base"],
                             "error_reduction_%": res["error_reduction_%"]}
    json.dump(out, open(os.path.join(HERE, "accuracy.json"), "w"), indent=2)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
