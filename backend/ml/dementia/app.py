"""
DEMENTIA ML API (port 5002)
=============================
Serves TWO complementary models, mirrors backend/ml/caregiver/app.py so it
plugs into the same Node -> axios -> Flask pattern already used for the
caregiver stress model (see backend/src/routes/caregiver/insightRoutes.js).

1) /predict       - severity classifier (train.py / dementia_model.pkl)
   Input: age, educationYears, ses, totalScore (0-30, same scale as
   scoringService.js's MMSE-style score), sex
   Output: none/mild/moderate/severe + confidence, alongside the existing
   rule-based severity so the two can be compared.

2) /predict-risk  - behavioral risk screener (train_screener.py /
   dementia_screener_model.pkl)
   Input: a caregiver-fillable checklist - no cognitive test required.
   Output: Alzheimer's risk probability + top contributing factors.
   Complementary to (1): informant-observation based, for triage BEFORE a
   formal MemoCare assessment even happens.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# ── Load severity model ─────────────────────────────────────────────────────
try:
    saved         = joblib.load('dementia_model.pkl')
    model         = saved['model']
    feature_cols  = saved['feature_cols']
    model_name    = saved.get('model_name', 'Random Forest')
    test_acc      = saved.get('test_acc', 0)
    test_mf1      = saved.get('test_macro_f1', 0)
    cv_mf1        = saved.get('cv_macro_f1', 0)
    severity_order = saved.get('severity_order', ['none', 'mild', 'moderate', 'severe'])
    print(f"Severity model loaded — {model_name}")
    print(f"Test acc: {test_acc*100:.1f}%  Test macro-F1: {test_mf1*100:.1f}%  CV macro-F1: {cv_mf1*100:.1f}%")
except Exception as e:
    print(f"Run train.py first! Error: {e}")
    model = None

# ── Load behavioral screener model ──────────────────────────────────────────
try:
    screener_saved   = joblib.load('dementia_screener_model.pkl')
    screener_model   = screener_saved['model']
    screener_features = screener_saved['feature_cols']
    screener_behavioral = screener_saved['behavioral_features']
    screener_context = screener_saved['context_features']
    screener_name    = screener_saved.get('model_name', 'Extra Trees')
    screener_auc     = screener_saved.get('test_auc', 0)
    screener_cv_auc  = screener_saved.get('cv_auc', 0)
    print(f"Screener model loaded — {screener_name}")
    print(f"Test AUC: {screener_auc*100:.1f}%  CV AUC: {screener_cv_auc*100:.1f}%")
except Exception as e:
    print(f"Run train_screener.py first! Error: {e}")
    screener_model = None

MESSAGES = {
    'none':     'No significant cognitive impairment detected.',
    'mild':     'Mild cognitive changes detected. Continue regular monitoring.',
    'moderate': 'Moderate cognitive impairment detected. Consider a clinical follow-up.',
    'severe':   'Significant cognitive impairment detected. Please consult a clinician promptly.',
}

# ── Same thresholds as backend/src/services/cognitive/scoringService.js ────
def rule_based_severity(total_score):
    if total_score >= 24: return 'none'
    if total_score >= 19: return 'mild'
    if total_score >= 10: return 'moderate'
    return 'severe'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':     'ok',
        'component':  'dementia',
        'port':       5002,
        'severityModel': {
            'status':     'loaded' if model else 'not loaded',
            'model_name': model_name if model else 'N/A',
            'test_acc':   f"{test_acc*100:.1f}%" if model else 'N/A',
            'test_macro_f1': f"{test_mf1*100:.1f}%" if model else 'N/A',
        },
        'screenerModel': {
            'status':     'loaded' if screener_model else 'not loaded',
            'model_name': screener_name if screener_model else 'N/A',
            'test_auc':   f"{screener_auc*100:.1f}%" if screener_model else 'N/A',
            'cv_auc':     f"{screener_cv_auc*100:.1f}%" if screener_model else 'N/A',
        },
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'success': False, 'message': 'Model not loaded. Run train.py first.'}), 500

    try:
        body = request.get_json()
        print(f"\n[Dementia API] Request: {body}")

        age        = float(body.get('age', 75))
        educ       = float(body.get('educationYears', 12))
        ses        = float(body.get('ses', 3))
        total_score = float(body.get('totalScore', 27))
        sex        = str(body.get('sex', '')).upper()
        sex_m      = 1 if sex == 'M' else 0

        features = {
            'Age':   age,
            'EDUC':  educ,
            'SES':   ses,
            'MMSE':  total_score,
            'Sex_M': sex_m,
        }
        X = pd.DataFrame([features])[feature_cols]

        ml_prediction = model.predict(X)[0]
        proba         = model.predict_proba(X)[0]
        classes       = list(model.classes_)
        proba_dict    = {cls: round(float(p), 3) for cls, p in zip(classes, proba)}
        confidence    = float(max(proba))

        rule_prediction = rule_based_severity(total_score)
        agrees          = (ml_prediction == rule_prediction)

        print(f"[Dementia API] ML -> {ml_prediction} ({confidence*100:.1f}%)  |  Rule -> {rule_prediction}"
              f"  |  Model: {model_name} (test acc {test_acc*100:.1f}%, macro-F1 {test_mf1*100:.1f}%)")

        return jsonify({
            'success':        True,
            'severity':       ml_prediction,
            'confidence':     round(confidence, 3),
            'probabilities':  proba_dict,
            'ruleBasedSeverity': rule_prediction,
            'agreesWithRule': agrees,
            'message':        MESSAGES.get(ml_prediction, ''),
            'submittedAt':    pd.Timestamp.now().isoformat(),
        })

    except Exception as e:
        print(f"[Dementia API] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


RISK_LEVELS = {
    'low':      'Low risk based on current observations. Continue routine monitoring.',
    'moderate': 'Some signs worth watching. Consider scheduling a MemoCare cognitive assessment.',
    'high':     'Multiple risk indicators present. Recommend a full cognitive assessment soon.',
}

def risk_bucket(probability):
    if probability < 0.35: return 'low'
    if probability < 0.6:  return 'moderate'
    return 'high'

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    """
    Behavioral checklist -> Alzheimer's risk probability.
    Body: booleans (0/1 or true/false) for the checklist items, plus
    demographics/lifestyle/history. Anything omitted defaults to 0/typical.
    """
    if screener_model is None:
        return jsonify({'success': False, 'message': 'Screener model not loaded. Run train_screener.py first.'}), 500

    try:
        body = request.get_json()
        print(f"\n[Screener API] Request: {body}")

        def b(key):  # coerce booleans / 0-1 flags safely
            v = body.get(key, 0)
            if isinstance(v, bool): return int(v)
            return int(float(v))

        features = {
            # behavioral checklist
            'MemoryComplaints':          b('memoryComplaints'),
            'BehavioralProblems':        b('behavioralProblems'),
            'Confusion':                 b('confusion'),
            'Disorientation':            b('disorientation'),
            'PersonalityChanges':        b('personalityChanges'),
            'DifficultyCompletingTasks': b('difficultyCompletingTasks'),
            'Forgetfulness':             b('forgetfulness'),
            # demographics / lifestyle / history
            'Age':                      float(body.get('age', 75)),
            'Gender':                   1 if str(body.get('gender', '')).upper().startswith('F') else 0,
            'EducationLevel':           int(body.get('educationLevel', 1)),
            'Smoking':                  b('smoking'),
            'AlcoholConsumption':       float(body.get('alcoholConsumption', 5)),
            'PhysicalActivity':         float(body.get('physicalActivity', 5)),
            'DietQuality':              float(body.get('dietQuality', 5)),
            'SleepQuality':             float(body.get('sleepQuality', 6)),
            'BMI':                      float(body.get('bmi', 25)),
            'FamilyHistoryAlzheimers':  b('familyHistoryAlzheimers'),
            'CardiovascularDisease':    b('cardiovascularDisease'),
            'Diabetes':                 b('diabetes'),
            'Depression':               b('depression'),
            'HeadInjury':               b('headInjury'),
            'Hypertension':             b('hypertension'),
        }
        X = pd.DataFrame([features])[screener_features]

        proba = float(screener_model.predict_proba(X)[0][1])
        bucket = risk_bucket(proba)

        # top contributing factors for this specific prediction (by global
        # feature importance among the checklist items the caregiver flagged)
        importances = dict(zip(screener_features, screener_model.feature_importances_))
        flagged = [f for f in screener_behavioral if features[f] == 1]
        flagged_ranked = sorted(flagged, key=lambda f: importances.get(f, 0), reverse=True)

        print(f"[Screener API] risk={proba:.3f} ({bucket})  flagged={flagged_ranked}")

        return jsonify({
            'success':        True,
            'riskProbability': round(proba, 3),
            'riskLevel':      bucket,
            'message':        RISK_LEVELS[bucket],
            'topFactors':     flagged_ranked[:3],
            'submittedAt':    pd.Timestamp.now().isoformat(),
        })

    except Exception as e:
        print(f"[Screener API] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("  DEMENTIA ML API — PORT 5002")
    print("  /predict       - severity classifier")
    print("  /predict-risk  - behavioral risk screener")
    print("-" * 50)
    if model:
        print(f"  Severity model : {model_name}")
        print(f"  Test accuracy  : {test_acc*100:.1f}%")
        print(f"  Test macro-F1  : {test_mf1*100:.1f}%")
        print(f"  CV macro-F1    : {cv_mf1*100:.1f}%")
    else:
        print("  Severity model : NOT LOADED (run train.py first)")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5002, debug=True)
