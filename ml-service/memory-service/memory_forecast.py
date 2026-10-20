"""
Memory-score forecast for the progress report: where will the daily memory score be
in 4 and 8 weeks, and how likely is a meaningful decline (>= 5 points in 4 weeks)?

Two models (research, training and evaluation: research/memory_forecast/):
  * trajectory - partial pooling (empirical-Bayes random slope, a mixed-effects model):
    the patient's own trend is trusted in proportion to how much consistent data they
    have; with few or noisy days it is pulled towards the population trend.
  * risk - scikit-learn gradient boosting on the pooled trajectory, the noise, adherence,
    MMSE and cognitive-game results.

Honesty rules: fewer than MIN_DAYS scored days in the last 30 (or under a week of span)
gives "not_enough_data" - no number is invented. The models were trained on a SIMULATED
cohort; the report says so.

Input day lists are [{"index": days relative to today (0 = today, -3 = three days ago),
"score": 0-100}], oldest first.
"""
import os

import numpy as np

MIN_DAYS = 5           # scored days in the last 30 before any forecast is shown
MIN_SPAN = 7           # ... spread over at least a week
WINDOW = 60            # days of history the trajectory uses
MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "forecast_model", "memory_forecast.joblib")
FEATURES = ["pooled_slope", "own_slope", "slope_se", "pool_weight", "level", "resid_sd", "n_days_30",
            "adherence_30", "mmse_last", "mmse_slope", "has_mmse", "games_slope", "has_games"]
DEFAULT_PRIOR = {"mu": -0.6, "tau2": 2.0, "n": 0}   # used only if the trained model file is missing
_bundle = None


def ols(points):
    """-> (value at index 0 = today, slope per day). One point -> (score, 0)."""
    x = np.array([p["index"] for p in points], dtype=float)
    y = np.array([p["score"] for p in points], dtype=float)
    if len(x) < 2 or np.ptp(x) == 0:
        return (float(y.mean()) if len(y) else 0.0), 0.0
    b = float(np.polyfit(x, y, 1)[0])
    return float(y.mean() - b * x.mean()), b


def _own(points):
    """Own trend with its uncertainty: (level, slope/week, se^2 of slope/week, resid sd)."""
    a, b = ols(points)
    x = np.array([p["index"] for p in points], dtype=float)
    y = np.array([p["score"] for p in points], dtype=float)
    resid = y - (a + b * x)
    sd = float(np.sqrt(np.sum(resid ** 2) / max(1, len(y) - 2))) if len(y) > 2 else 10.0
    sxx = float(np.sum((x - x.mean()) ** 2)) or 1.0
    return a, b * 7, (max(sd, 3.0) ** 2 / sxx) * 49, sd


def _recent(days):
    return [d for d in days if d["index"] > -WINDOW]


def fit_prior(histories, min_points=MIN_DAYS):
    """Population distribution of the weekly slope (method of moments):
    mu = precision-weighted mean slope, tau^2 = between-patient variance."""
    slopes, ses = [], []
    for days in histories:
        r = _recent(days)
        if len(r) >= min_points:
            _a, s, se2, _sd = _own(r)
            slopes.append(s)
            ses.append(se2)
    if len(slopes) < 2:
        return dict(DEFAULT_PRIOR)
    slopes, ses = np.array(slopes), np.array(ses)
    w = 1 / ses
    mu = float(np.sum(w * slopes) / np.sum(w))
    tau2 = float(max(np.var(slopes) - np.mean(ses), 0.05))
    return {"mu": round(mu, 3), "tau2": round(tau2, 3), "n": int(len(slopes))}


def trajectory(days, prior, min_days=MIN_DAYS):
    r = _recent(days)
    if len(r) < min_days:
        return None
    _a, own_s, se2, sd = _own(r)
    w = prior["tau2"] / (prior["tau2"] + se2)                     # how much the patient's own trend is trusted
    slope_w = w * own_s + (1 - w) * prior["mu"]
    post_var = 1 / (1 / prior["tau2"] + 1 / se2)
    x = np.array([p["index"] for p in r], dtype=float)
    y = np.array([p["score"] for p in r], dtype=float)
    level = float(np.mean(y - (slope_w / 7) * x))               # line through the data with the pooled slope
    lvl_var = max(sd, 3.0) ** 2 / len(y)

    def at(weeks):
        mean = float(np.clip(level + slope_w * weeks, 0, 100))
        half = 1.96 * float(np.sqrt(lvl_var + weeks ** 2 * post_var))
        return round(mean, 1), [round(max(0.0, mean - half), 1), round(min(100.0, mean + half), 1)]

    w4, ci4 = at(4)
    w8, ci8 = at(8)
    return {"level": round(float(np.clip(level, 0, 100)), 1), "slope_week": round(float(slope_w), 2),
            "own_slope_week": round(float(own_s), 2), "slope_se": round(float(np.sqrt(se2)), 2),
            "pool_weight": round(float(w), 2), "resid_sd": round(sd, 1), "n": len(r),
            "w4": w4, "ci4": ci4, "w8": w8, "ci8": ci8}


def _slope_of(points, key, per):
    pts = [{"index": p["index"], "score": p[key]} for p in points]
    return ols(pts)[1] * per if len(pts) >= 2 else 0.0


def features(days, mmse, games, prior):
    t = trajectory(days, prior, min_days=2) or {"slope_week": prior["mu"], "own_slope_week": 0.0, "slope_se": 10.0,
                                                 "pool_weight": 0.0, "level": 50.0, "resid_sd": 10.0}
    last30 = [d for d in days if d["index"] > -30]
    played = len({d["index"] for d in last30})
    return [t["slope_week"], t["own_slope_week"], t["slope_se"], t["pool_weight"], t["level"], t["resid_sd"],
            len(last30), played / 30, mmse[-1]["total"] if mmse else 0.0, _slope_of(mmse, "total", 30),
            1.0 if mmse else 0.0, _slope_of(games, "accuracy", 7) if len(games) >= 3 else 0.0, 1.0 if games else 0.0]


def _model():
    global _bundle
    if _bundle is None:
        try:
            import joblib
            _bundle = joblib.load(MODEL_FILE)
        except Exception as e:
            # e.g. another scikit-learn version: keep the trained prior (plain JSON), skip the risk
            print("[memory_forecast] risk model not loaded, trajectory only:", e)
            try:
                import json
                _bundle = json.load(open(os.path.join(os.path.dirname(MODEL_FILE), "prior.json")))
            except Exception:
                _bundle = {}
    return _bundle


def forecast(days, mmse=(), games=()):
    """-> {"status": "ok", now, w4, ci4, w8, ci8, slope_week, pool_weight, risk, risk_level, ...}
    or {"status": "not_enough_data", have_days, need_days}."""
    mmse, games = list(mmse), list(games)
    last30 = [d for d in days if d["index"] > -30]
    span = (last30[-1]["index"] - last30[0]["index"]) if len(last30) >= 2 else 0
    if len(last30) < MIN_DAYS or span < MIN_SPAN:
        return {"status": "not_enough_data", "have_days": len(last30), "need_days": MIN_DAYS, "need_span_days": MIN_SPAN}
    b = _model()
    prior = b.get("prior") or DEFAULT_PRIOR
    t = trajectory(days, prior)
    out = {"status": "ok", "now": t["level"], **t, "method": "partial pooling (empirical-Bayes random slope)",
           "trained_on": b.get("trained_on", "-"), "model_metrics": b.get("metrics")}
    if b.get("gb") is not None:
        p = float(b["gb"].predict_proba([features(days, mmse, games, prior)])[0, 1])
        out["risk"] = round(p, 3)
        out["risk_level"] = "high" if p >= 0.5 else "medium" if p >= 0.2 else "low"
    return out


def days_from_daily(daily):
    """Report's daily list -> forecast input (index relative to the last day)."""
    pts = [x for x in daily if x.get("score") is not None]
    last = len(daily) - 1
    return [{"index": x["index"] - last, "score": x["score"]} for x in pts]
