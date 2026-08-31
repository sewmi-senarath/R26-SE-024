"""
DEMENTIA ML API (port 5002)
=============================
Mirrors backend/ml/caregiver/app.py so it plugs into the same Node -> axios ->
Flask pattern used for the caregiver stress model (see
backend/src/services/cognitive/dementiaPrediction/dementiaPredictionService.js).

/predict - PRIMARY: 2-class triage (monitor / escalate, ~93% accuracy)
           SECONDARY: 4-class estimated stage (none/mild/moderate/severe, ~76%)
   Input : age, educationYears, totalScore (MMSE 0-30, same scale as
           scoringService.js), sex ("M"/"F"), faq = { bills, taxes, shopping,
           games, stove, mealPrep, events, payAttention, remindDates, travel }
           each 0-3.  (ses is accepted but ignored.)
   Output: triage + triageConfidence + triageProbabilities,
           stage  + stageConfidence  + stageProbabilities, message.

Model file (dementia_model.pkl) is produced by train.py.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# FAQ request keys (camelCase from Node) -> model feature columns.
FAQ_KEY_TO_COL = {
    "bills":        "FAQ_BILLS",
    "taxes":        "FAQ_TAXES",
    "shopping":     "FAQ_SHOPPING",
    "games":        "FAQ_GAMES",
    "stove":        "FAQ_STOVE",
    "mealPrep":     "FAQ_MEALPREP",
    "events":       "FAQ_EVENTS",
    "payAttention": "FAQ_PAYATTN",
    "remindDates":  "FAQ_REMDATES",
    "travel":       "FAQ_TRAVEL",
}

# ── Load models ────────────────────────────────────────────────────────────
try:
    saved          = joblib.load("dementia_model.pkl")
    triage_model   = saved["triage_model"]
    stage_model    = saved["stage_model"]
    feature_cols   = saved["feature_cols"]
    triage_cv_acc  = saved.get("triage_cv_acc", 0)
    triage_macro_f1 = saved.get("triage_macro_f1", 0)
    stage_cv_acc   = saved.get("stage_cv_acc", 0)
    trained_on     = saved.get("trained_on", [])
    print(f"Models loaded — triage CV acc {triage_cv_acc*100:.1f}% "
          f"(macro-F1 {triage_macro_f1*100:.1f}%), stage CV acc {stage_cv_acc*100:.1f}%")
except Exception as e:
    print(f"Run train.py first! Error: {e}")
    triage_model = stage_model = None

STAGE_LABEL = {
    "none": "no significant impairment",
    "mild": "mild cognitive changes",
    "moderate": "moderate cognitive impairment",
    "severe": "significant cognitive impairment",
}


def build_message(triage, stage):
    stage_txt = STAGE_LABEL.get(stage, "an uncertain stage")
    if triage == "escalate":
        return (f"Screening suggests {stage_txt}. A clinical review is recommended "
                f"to confirm and plan next steps.")
    return (f"Screening suggests {stage_txt}. Keep monitoring with regular "
            f"assessments; no clinical escalation indicated right now.")


def probs(model, X):
    proba = model.predict_proba(X)[0]
    return {cls: round(float(p), 3) for cls, p in zip(list(model.classes_), proba)}


@app.route("/health", methods=["GET"])
def health():
    ok = triage_model is not None
    return jsonify({
        "status":    "ok" if ok else "degraded",
        "component": "dementia",
        "port":      5002,
        "models": {
            "status":         "loaded" if ok else "not loaded",
            "trained_on":     trained_on if ok else [],
            "triage_cv_acc":  f"{triage_cv_acc*100:.1f}%" if ok else "N/A",
            "triage_macro_f1": f"{triage_macro_f1*100:.1f}%" if ok else "N/A",
            "stage_cv_acc":   f"{stage_cv_acc*100:.1f}%" if ok else "N/A",
        },
    })


@app.route("/predict", methods=["POST"])
def predict():
    if triage_model is None:
        return jsonify({"success": False, "message": "Model not loaded. Run train.py first."}), 500

    try:
        body = request.get_json(force=True) or {}
        print(f"\n[Dementia API] Request: {body}")

        faq = body.get("faq") or {}
        missing = [k for k in FAQ_KEY_TO_COL if k not in faq]
        if missing:
            return jsonify({
                "success": False,
                "message": f"faq is missing {len(missing)} item(s): {missing}",
            }), 400

        row = {
            "Age":   float(body.get("age", 75)),
            "EDUC":  float(body.get("educationYears", 12)),
            "MMSE":  float(body.get("totalScore", 27)),
            "Sex_M": 1 if str(body.get("sex", "")).upper().startswith("M") else 0,
        }
        faq_vals = []
        for key, col in FAQ_KEY_TO_COL.items():
            v = float(faq[key])
            row[col] = v
            faq_vals.append(v)
        row["FAQ_TOTAL"] = sum(faq_vals)

        X = pd.DataFrame([row])[feature_cols]

        triage = str(triage_model.predict(X)[0])
        stage  = str(stage_model.predict(X)[0])
        triage_p = probs(triage_model, X)
        stage_p  = probs(stage_model, X)

        result = {
            "success":             True,
            "triage":              triage,
            "triageConfidence":    round(max(triage_p.values()), 3),
            "triageProbabilities": triage_p,
            "stage":               stage,
            "stageConfidence":     round(max(stage_p.values()), 3),
            "stageProbabilities":  stage_p,
            "message":             build_message(triage, stage),
            "submittedAt":         pd.Timestamp.now().isoformat(),
        }
        print(f"[Dementia API] -> triage={triage} ({result['triageConfidence']*100:.0f}%)  "
              f"stage={stage} ({result['stageConfidence']*100:.0f}%)")
        return jsonify(result)

    except Exception as e:
        print(f"[Dementia API] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    print("=" * 50)
    print("  DEMENTIA ML API - PORT 5002")
    print("  /predict  - triage (monitor/escalate) + estimated stage")
    print("-" * 50)
    if triage_model is not None:
        print(f"  Triage CV accuracy : {triage_cv_acc*100:.1f}%")
        print(f"  Triage macro-F1    : {triage_macro_f1*100:.1f}%")
        # print(f"  Stage  CV accuracy : {stage_cv_acc*100:.1f}%  (secondary)")
        print(f"  Trained on         : {', '.join(trained_on)}")
    else:
        print("  Models : NOT LOADED (run train.py first)")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5002, debug=True)
