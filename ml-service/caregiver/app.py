from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
# --Create the API app and enable CORS
app  = Flask(__name__)
CORS(app)

# ── Load model ─────────────────────────────────────────────────────────────
try:
    saved        = joblib.load('stress_model.pkl')
    model        = saved['model']
    feature_cols = saved['feature_cols']
    model_name   = saved.get('model_name', 'Unknown')
    accuracy     = saved.get('accuracy', 0)
    print(f"✅ Model loaded - {model_name} - Accuracy: {accuracy*100:.1f}%")
    print(f"✅ Features required: {len(feature_cols)}")
except Exception as e:
    print(f"❌ Run tune_model.py first! Error: {e}")
    model = None
    saved = {}

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
        'Please take a break now - your wellbeing matters.',
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
#--Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':    'ok',
        'component': 'caregiver',
        'port':      5001,
        'model':     'loaded' if model else 'not loaded',
        'accuracy':  f"{saved.get('accuracy',0)*100:.1f}%" if model else 'N/A',
        'features':  len(feature_cols) if model else 0,
    })
#-Daily check-in details send to the API for stress prediction
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'success': False,
            'message': 'Model not loaded. Run tune_model.py first.',
        }), 500

    try:
        body = request.get_json()
        print(f"\n[Caregiver API] Request received")

        # ── Extract values from frontend form ──────────────────────────────
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
        patients_count = float(body.get('patientsAssigned', 5))

        # ── Derived features (original) ────────────────────────────────────
        tasks_pending            = max(0, tasks_assigned - tasks_done)
        task_completion_rate     = tasks_done / max(tasks_assigned, 1)
        workload_score           = tasks_pending + difficult
        wellbeing_score          = overwhelm + exhausted + drained
        sleep_deficit            = 8 - sleep
        task_pressure            = tasks_assigned / max(hours_care, 1)
        emotional_burden         = overwhelm + diff_managing
        physical_mental_combined = tired + exhausted
        recovery_score           = sleep + breaks
        overwhelm_index          = overwhelm * difficult

        # ── New derived features (added in tune_model.py) ─────────────────
        pending_ratio            = tasks_pending / max(tasks_assigned, 1)
        stress_load              = tired * hours_care
        emotional_physical_ratio = wellbeing_score / (tired + 1)
        break_efficiency         = breaks / max(hours_care, 1)
        mood_overwhelm_gap       = mood - overwhelm
        total_stress_index       = (tired + wellbeing_score + workload_score) / 3
        high_risk_flag           = 1 if (sleep < 6 and wellbeing_score > 9) else 0
        task_stress_interaction  = task_pressure * tired
        recovery_deficit         = workload_score / (recovery_score + 1)
        emotional_collapse_risk  = wellbeing_score * tired
        workload_per_hour        = tasks_assigned / max(hours_care, 1)

        # ── Build ALL features ─────────────────────────────────────────────
        all_features = {
            # Encoded categorical - age/type/experience/support aren't
            # collected anywhere in the app yet (no registration field for
            # them), so these stay as neutral fixed defaults until that's
            # added. Patient count IS real data your Caregiver profile
            # already tracks, so it's passed in from the caller now instead.
            'age_encoded':    1,
            'type_encoded':   0,
            'exp_encoded':    1,
            'sup_encoded':    1,

            # Raw numeric
            'How many patients do you currently care for?':                                                           patients_count,
            'How many hours did you sleep last night?':                                                               sleep,
            'How physically tired do you feel today?':                                                                tired,
            'How many hours did you spend caregiving today?':                                                         hours_care,
            'How many caregiving tasks were assigned today?':                                                         tasks_assigned,
            'How many tasks did you complete today?':                                                                 tasks_done,
            'How many tasks are still pending?':                                                                      tasks_pending,
            'How many difficult situations (e.g., patient confusion, agitation) occurred today?':                     difficult,
            'How would you describe your mood today?':                                                                mood,
            'Did you feel emotionally overwhelmed today?':                                                            overwhelm,
            'I felt mentally exhausted today Question':                                                               exhausted,
            'I had difficulty managing my caregiving tasks today':                                                    diff_managing,
            'I felt emotionally drained today':                                                                       drained,
            'How many breaks did you take today?':                                                                    breaks,

            # Engineered features (original)
            'task_completion_rate':      task_completion_rate,
            'workload_score':            workload_score,
            'wellbeing_score':           wellbeing_score,
            'sleep_deficit':             sleep_deficit,
            'task_pressure':             task_pressure,
            'emotional_burden':          emotional_burden,
            'physical_mental_combined':  physical_mental_combined,
            'recovery_score':            recovery_score,
            'overwhelm_index':           overwhelm_index,

            # Engineered features (new)
            'pending_ratio':             pending_ratio,
            'stress_load':               stress_load,
            'emotional_physical_ratio':  emotional_physical_ratio,
            'break_efficiency':          break_efficiency,
            'mood_overwhelm_gap':        mood_overwhelm_gap,
            'total_stress_index':        total_stress_index,
            'high_risk_flag':            high_risk_flag,
            'task_stress_interaction':   task_stress_interaction,
            'recovery_deficit':          recovery_deficit,
            'emotional_collapse_risk':   emotional_collapse_risk,
            'workload_per_hour':         workload_per_hour,
        }

        # ── Predict using only features the model was trained on ───────────
        X = pd.DataFrame([all_features])[feature_cols]

        # Get class probabilities
        try:
            proba   = model.predict_proba(X)[0]
            classes = list(model.classes_)
            prob_map = dict(zip(classes, proba))
        except Exception:
            prob_map = None

        prediction = model.predict(X)[0]

        # ── High-risk override ──────────────────────────────────────────────
        # The model correctly assigns meaningful probability to 'High' even on
        # genuinely bad check-ins (empirically ~0.30-0.40 on extreme cases),
        # but 'Moderate' often still wins the plain argmax by a small margin.
        # Since under-flagging a genuinely High-stress caregiver is worse than
        # occasionally over-flagging one, treat 'High' as the prediction
        # whenever its own probability crosses this bar - even if it isn't
        # technically the single highest of the three.
        HIGH_RISK_THRESHOLD = 0.35
        if prob_map and prob_map.get('High', 0) >= HIGH_RISK_THRESHOLD:
            prediction = 'High'

        # Confidence should reflect the probability of whichever class is
        # actually being returned, not just whichever was highest overall -
        # otherwise an overridden 'High' would misleadingly report Moderate's
        # (higher) probability as its own confidence.
        if prob_map:
            confidence = float(prob_map.get(prediction, max(proba)))
        else:
            confidence = 0.80

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

#--Run the Flask API
if __name__ == '__main__':
    print("=" * 50)
    print("CAREGIVER ML API - PORT 5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
    
