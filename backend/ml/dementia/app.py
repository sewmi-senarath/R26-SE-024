"""
DEMENTIA ML API (port 5002)
=============================
Mirrors backend/ml/caregiver/app.py so it plugs into the same Node -> axios ->
Flask pattern already used for the caregiver stress model (see
backend/src/routes/caregiver/insightRoutes.js).

/predict - severity classifier (train.py / dementia_model.pkl)
   Input: age, educationYears, ses, totalScore (0-30, same scale as
   scoringService.js's MMSE-style score), sex
   Output: none/mild/moderate/severe + confidence + per-class probabilities.
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

MESSAGES = {
    'none':     'No significant cognitive impairment detected.',
    'mild':     'Mild cognitive changes detected. Continue regular monitoring.',
    'moderate': 'Moderate cognitive impairment detected. Consider a clinical follow-up.',
    'severe':   'Significant cognitive impairment detected. Please consult a clinician promptly.',
}

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

        print(f"[Dementia API] ML -> {ml_prediction} ({confidence*100:.1f}%)"
              f"  |  Model: {model_name} (test acc {test_acc*100:.1f}%, macro-F1 {test_mf1*100:.1f}%)")

        return jsonify({
            'success':        True,
            'severity':       ml_prediction,
            'confidence':     round(confidence, 3),
            'probabilities':  proba_dict,
            'message':        MESSAGES.get(ml_prediction, ''),
            'submittedAt':    pd.Timestamp.now().isoformat(),
        })

    except Exception as e:
        print(f"[Dementia API] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("  DEMENTIA ML API — PORT 5002")
    print("  /predict       - severity classifier")
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
