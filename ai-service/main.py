import os
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import shutil
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('yolov8n.pt')

MODELS_DIR = "behavior_models"
os.makedirs(MODELS_DIR, exist_ok=True)

# ─── Schemas ──────────────────────────────────────────────────────
class BehaviorLog(BaseModel):
    patientId: str
    activity: str
    timestamp: str

class BehaviorLogEntry(BaseModel):
    hour: int
    dayOfWeek: int
    activity: str
    duration: float = 0

class TrainRequest(BaseModel):
    patientId: str
    logs: list[BehaviorLogEntry]

class AlertRequest(BaseModel):
    patientId: str
    hour: int
    dayOfWeek: int
    patientName: str = "Patient"

# ─── Activity Labels ──────────────────────────────────────────────
ACTIVITIES = ['eating', 'sleeping', 'walking', 'wandering', 'sitting',
              'medication', 'bathing', 'exercise', 'socializing', 'other']

# ─── Activity Alert Templates (natural language, patient name injected) ───────
def build_alert_message(name: str, activity: str, hour: int) -> str:
    period = "morning" if hour < 12 else ("afternoon" if hour < 17 else "evening")
    templates = {
        'eating':      f"{name}, it's {period} meal time. Please come to the dining area.",
        'sleeping':    f"{name}, it's time to rest now. Let's get you to bed.",
        'medication':  f"{name}, it's time for your {period} medication. Please take your pills.",
        'walking':     f"{name}, time for your {period} walk. A short walk will do you good.",
        'bathing':     f"{name}, it's bath time. Let's get you freshened up.",
        'exercise':    f"{name}, time for your {period} exercises. Let's keep moving.",
        'socializing': f"{name}, it's a good time to spend with family or friends.",
        'sitting':     f"{name}, take a comfortable seat and relax for a while.",
        'wandering':   f"{name}, please stay in a safe area. Your caregiver has been notified.",
    }
    return templates.get(activity.lower(), f"{name}, it's time for {activity}.")


# ─── Object Detection (alias: /detect for mobile) ─────────────────────────────
@app.post("/detect")
@app.post("/detect-objects")
async def detect_objects(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename or 'scan.jpg'}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        results = model(temp_path)
        detections = []
        seen = set()

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = model.names[cls_id]
                xyxy = box.xyxy[0].tolist() if box.xyxy is not None else []
                detections.append({
                    "label":      name,
                    "class":      name,
                    "class_id":   cls_id,
                    "class_name": name,
                    "confidence": round(conf, 4),
                    "bbox_xyxy":  [round(v, 1) for v in xyxy],
                })
                seen.add(name)

        return {
            "status":     "success",
            "detections": detections,
            "objects":    list(seen),
            "count":      len(detections)
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ─── Train Behavior Pattern Model ─────────────────────────────────
@app.post("/train-behavior")
async def train_behavior(req: TrainRequest):
    try:
        if len(req.logs) < 5:
            return {"status": "error", "message": "Need at least 5 log entries"}

        df = pd.DataFrame([l.model_dump() for l in req.logs])

        le = LabelEncoder()
        known_activities = ACTIVITIES + list(df['activity'].unique())
        le.fit(known_activities)
        df['activity_enc'] = le.transform(df['activity'].str.lower().str.strip().apply(
            lambda x: x if x in le.classes_ else 'other'
        ))

        X = df[['hour', 'dayOfWeek', 'activity_enc', 'duration']].values

        iso = IsolationForest(contamination=0.1, random_state=42)
        iso.fit(X)

        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(df[['hour', 'dayOfWeek']].values, df['activity_enc'].values)

        # Build routine: most common activity per hour (from real data)
        routine = {}
        for hour in range(24):
            hour_data = df[df['hour'] == hour]
            if not hour_data.empty:
                most_common = hour_data['activity'].value_counts().index[0]
                routine[str(hour)] = most_common

        patient_dir = os.path.join(MODELS_DIR, req.patientId)
        os.makedirs(patient_dir, exist_ok=True)
        joblib.dump(iso, os.path.join(patient_dir, 'anomaly.pkl'))
        joblib.dump(clf, os.path.join(patient_dir, 'classifier.pkl'))
        joblib.dump(le, os.path.join(patient_dir, 'encoder.pkl'))
        with open(os.path.join(patient_dir, 'routine.json'), 'w') as f:
            json.dump(routine, f)

        return {
            "status": "success",
            "patientId": req.patientId,
            "samples_trained": len(df),
            "routine": routine,
            "activities_learned": list(df['activity'].unique())
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ─── Get Behavior Pattern Summary ─────────────────────────────────
@app.get("/behavior-pattern/{patientId}")
async def get_pattern(patientId: str):
    routine_path = os.path.join(MODELS_DIR, patientId, 'routine.json')
    if not os.path.exists(routine_path):
        return {"status": "not_trained", "message": "No model trained for this patient"}
    with open(routine_path) as f:
        routine = json.load(f)
    return {"status": "success", "patientId": patientId, "routine": routine}


# ─── Predict Voice Alert (from real trained routine) ──────────────
@app.post("/predict-alert")
async def predict_alert(req: AlertRequest):
    routine_path = os.path.join(MODELS_DIR, req.patientId, 'routine.json')
    name = req.patientName

    # ── Use trained routine.json (real patient data) ──
    if os.path.exists(routine_path):
        with open(routine_path) as f:
            routine = json.load(f)

        expected = routine.get(str(req.hour))

        if expected:
            message = build_alert_message(name, expected, req.hour)
            return {
                "status": "alert",
                "activity": expected,
                "message": message,
                "hour": req.hour,
                "routine": routine,   # send full routine back to mobile
                "speak": True
            }
        else:
            # Hour not in routine — no scheduled activity
            return {
                "status": "no_alert",
                "message": "",
                "routine": routine,
                "speak": False
            }

    # ── No model trained yet — tell the user ──
    return {
        "status": "not_trained",
        "message": f"{name}, your routine model has not been trained yet. Please contact your caregiver.",
        "speak": False
    }


# ─── Analyze Behavior Logs ────────────────────────────────────────
@app.post("/analyze-behavior")
async def analyze_behavior(logs: list[BehaviorLog]):
    df = pd.DataFrame([log.dict() for log in logs])
    patterns = df['activity'].value_counts().to_dict()
    return {"status": "success", "patterns": patterns, "anomalies": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

