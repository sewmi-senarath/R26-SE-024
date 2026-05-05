from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app  = Flask(__name__)
CORS(app)

# Load model
try:
    saved        = joblib.load('stress_model.pkl')
    model        = saved['model']
    feature_cols = saved['feature_cols']
    model_name   = saved.get('model_name', 'Random Forest')
    accuracy     = saved.get('accuracy', 0)
    print(f"✅ Model loaded — {model_name} — Accuracy: {accuracy*100:.1f}%")
    print(f"✅ Features: {feature_cols}")
except Exception as e:
    print(f"❌ Run train.py first! Error: {e}")
    model = None

TIPS = {
    'Low': [
        'You are doing great! Keep up your healthy habits.',
        'Maintain your current sleep schedule.',
        'Continue taking regular breaks throughout the day.',
    ],
    'Moderate': [
        'Take a short break every 2 hours.',
        'Try to delegate some tasks if possible.',
        'Drink more water and step outside briefly.',
        'Talk to a colleague about how you are feeling.',
    ],
    'High': [
        'Please take a break now — your wellbeing matters.',
        'Ask for help with some of your tasks today.',
        'Try a 5-minute breathing exercise right now.',
        'Speak to your supervisor about your workload.',
        'Make sure you eat and rest properly today.',
    ],
}

MESSAGES = {
    'Low':      'You are managing well today. Keep taking care of yourself!',
    'Moderate': 'You have had a busy day. Watch your energy levels carefully.',
    'High':     'High stress detected. Please take a break and seek support.',
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':    'ok',
        'component': 'caregiver',
        'port':      5001,
        'model':     'loaded' if model else 'not loaded',
        'accuracy':  f"{saved['accuracy']*100:.1f}%" if model else 'N/A',
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'success': False,
            'message': 'Model not loaded. Run train.py first.',
        }), 500

    try:
        body = request.get_json()
        print(f"\n[Caregiver API] Request: {body}")

        # Extract values from frontend
        sleep          = float(body.get('sleepHours', 7))
        tired          = float(body.get('physicalTiredness', 3))
        mood           = float(body.get('mood', 3))
        overwhelm      = float(body.get('emotionalOverwhelm', 3))
        hours_care     = float(body.get('hoursCaregiving', 8))
        tasks_assigned = float(body.get('tasksAssigned', 10))
        tasks_done     = float(body.get('tasksCompleted', 8))
        difficult      = float(body.get('difficultSituations', 2))
        breaks         = float(body.get('breaksTaken', 1))
        exhausted      = float(body.get('mentallyExhausted', 3))
        diff_managing  = float(body.get('difficultyManaging', 3))
        drained        = float(body.get('emotionallyDrained', 3))

        # Derived features
        tasks_pending   = max(0, tasks_assigned - tasks_done)
        task_completion = tasks_done / max(tasks_assigned, 1)
        workload_score  = tasks_pending + difficult
        wellbeing_score = overwhelm + exhausted + drained
        sleep_deficit   = 8 - sleep
        task_pressure   = tasks_assigned / max(hours_care, 1)
        emotional_burden = overwhelm + diff_managing
        physical_mental_combined = tired + exhausted

        # Build ALL possible feature values
        all_features = {
            'age_encoded':   1,
            'type_encoded':  0,
            'exp_encoded':   1,
            'sup_encoded':   1,
            'How many patients do you currently care for?':                                                         5,
            'How many hours did you sleep last night?':                                                             sleep,
            'How physically tired do you feel today? (1=Not tired, 5=Extremely tired)':                            tired,
            'How many hours did you spend caregiving today?':                                                       hours_care,
            'How many caregiving tasks were assigned today?':                                                       tasks_assigned,
            'How many tasks did you complete today?':                                                               tasks_done,
            'How many tasks are still pending?':                                                                    tasks_pending,
            'How many difficult situations occurred today? (e.g., patient confusion, agitation)':                   difficult,
            'How would you describe your mood today? (1=Very bad, 5=Very good)':                                   mood,
            'Did you feel emotionally overwhelmed today? (1=Not at all, 5=Extremely)':                             overwhelm,
            'I felt mentally exhausted today (1=Strongly Disagree, 5=Strongly Agree)':                             exhausted,
            'I had difficulty managing my caregiving tasks today (1=Strongly Disagree, 5=Strongly Agree)':         diff_managing,
            'I felt emotionally drained today (1=Strongly Disagree, 5=Strongly Agree)':                            drained,
            'How many breaks did you take today?':                                                                  breaks,
            'task_completion_rate':      task_completion,
            'workload_score':            workload_score,
            'wellbeing_score':           wellbeing_score,
            'sleep_deficit':             sleep_deficit,
            'task_pressure':             task_pressure,
            'emotional_burden':          emotional_burden,
            'physical_mental_combined':  physical_mental_combined,
        }

        # Use only the features the model was trained on
        X = pd.DataFrame([all_features])[feature_cols]

        # Predict
        prediction = model.predict(X)[0]
        proba      = model.predict_proba(X)[0]
        confidence = float(max(proba))

        score_map    = {'Low': 3, 'Moderate': 6, 'High': 9}
        stress_score = score_map.get(prediction, 5)

        print(f"[Caregiver API] → {prediction} ({confidence*100:.1f}% confidence)")

        return jsonify({
            'success':     True,
            'stressLevel': prediction,
            'stressScore': stress_score,
            'confidence':  round(confidence, 2),
            'message':     MESSAGES[prediction],
            'tips':        TIPS[prediction],
            'submittedAt': pd.Timestamp.now().isoformat(),
        })

    except Exception as e:
        print(f"[Caregiver API] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("CAREGIVER ML API - PORT 5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)