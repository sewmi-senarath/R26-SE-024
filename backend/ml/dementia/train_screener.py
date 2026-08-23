"""
BEHAVIORAL RISK SCREENER - TRAINING
=====================================
Dataset : Alzheimer's Disease Dataset (Kaggle)
Source  : https://www.kaggle.com/datasets/rabieelkharoua/alzheimers-disease-dataset
          2,149 synthetic patient records. NOTE: this dataset is statistically
          generated (not real clinical data) - MMSE only loosely tracks the
          Diagnosis label here, which is why we deliberately do NOT use MMSE/
          FunctionalAssessment/ADL as inputs. Those numbers are "test-derived"
          anyway; a caregiver filling this out at home wouldn't have them.

Goal: predict Alzheimer's risk from things a CAREGIVER can observe and report
without the patient taking any cognitive test - a pre-screening / triage tool,
complementary to the OASIS-based severity model (train.py) which needs an
actual completed MemoCare assessment. Same idea as informant questionnaires
used clinically (e.g. AD8, IQCODE) before ordering a full workup.
"""

import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix,
)

DATA_PATH  = "alzheimers_disease_data.csv"
MODEL_SAVE = "dementia_screener_model.pkl"

print("=" * 65)
print("  BEHAVIORAL RISK SCREENER - TRAINING")
print("=" * 65)

# STEP 1 - LOAD
df = pd.read_csv(DATA_PATH)
print(f"\nLoaded {len(df)} patients")
print(f"Diagnosis distribution:\n{df['Diagnosis'].value_counts()}")
print(f"  ({df['Diagnosis'].mean()*100:.1f}% positive)")

# STEP 2 - FEATURES
# Caregiver-observable behavioral checklist (no test required)
behavioral_features = [
    "MemoryComplaints", "BehavioralProblems", "Confusion", "Disorientation",
    "PersonalityChanges", "DifficultyCompletingTasks", "Forgetfulness",
]
# Demographics + lifestyle + medical history - things a caregiver/family
# member would reasonably know, still no clinical test needed
context_features = [
    "Age", "Gender", "EducationLevel",
    "Smoking", "AlcoholConsumption", "PhysicalActivity", "DietQuality", "SleepQuality", "BMI",
    "FamilyHistoryAlzheimers", "CardiovascularDisease", "Diabetes",
    "Depression", "HeadInjury", "Hypertension",
]
feature_cols = behavioral_features + context_features

# Deliberately excluded: MMSE, FunctionalAssessment, ADL (test-derived,
# defeats the point of a no-test screener), SystolicBP/DiastolicBP/Cholesterol*
# (lab values a caregiver wouldn't casually have), Ethnicity (avoid the model
# leaning on demographic proxies with no established causal role),
# PatientID / DoctorInCharge (identifiers, not signal)

X = df[feature_cols].copy()
y = df["Diagnosis"]

print(f"\nUsing {len(feature_cols)} caregiver-observable features (no cognitive test required):")
print(f"  Behavioral checklist: {behavioral_features}")
print(f"  Demographics/lifestyle/history: {context_features}")

# STEP 3 - SPLIT (random patient-level split - one row per patient, no repeats)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train)}  |  Test: {len(X_test)}")

# STEP 4 - TRAIN
models = {
    "Random Forest": RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=3,
        class_weight="balanced", random_state=42, n_jobs=-1),
    "Extra Trees": ExtraTreesClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=3,
        class_weight="balanced", random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        subsample=0.8, random_state=42),
}

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
print(f"\n{'Model':<20}{'Test Acc':>10}{'Test F1':>10}{'Test AUC':>10}{'CV AUC':>10}")
results = {}
for name, m in models.items():
    m.fit(X_train, y_train)
    pred  = m.predict(X_test)
    proba = m.predict_proba(X_test)[:, 1]
    acc   = accuracy_score(y_test, pred)
    f1    = f1_score(y_test, pred)
    auc   = roc_auc_score(y_test, proba)
    cv    = cross_val_score(m, X, y, cv=skf, scoring="roc_auc")
    print(f"{name:<20}{acc*100:>9.1f}%{f1*100:>9.1f}%{auc*100:>9.1f}%{cv.mean()*100:>9.1f}%")
    results[name] = {"model": m, "acc": acc, "f1": f1, "auc": auc, "cv": cv.mean(), "pred": pred, "proba": proba}

best_name = max(results, key=lambda k: results[k]["auc"])
best = results[best_name]

print(f"\nBEST MODEL: {best_name}  (selected on test ROC-AUC)")
print(f"\nClassification report:")
print(classification_report(y_test, best["pred"], target_names=["No Alzheimer's", "Alzheimer's"]))

cm = confusion_matrix(y_test, best["pred"])
cm_df = pd.DataFrame(cm,
    index=["Actual: No", "Actual: Yes"],
    columns=["Pred: No", "Pred: Yes"])
print("Confusion matrix:")
print(cm_df.to_string())

if hasattr(best["model"], "feature_importances_"):
    print("\nFeature importance:")
    imp = pd.Series(best["model"].feature_importances_, index=feature_cols).sort_values(ascending=False)
    for feat, val in imp.items():
        bar = "#" * int(val * 80)
        print(f"  {bar:<25} {val:.3f}  {feat}")

# STEP 5 - SAVE
joblib.dump({
    "model":        best["model"],
    "feature_cols": feature_cols,
    "behavioral_features": behavioral_features,
    "context_features": context_features,
    "model_name":   best_name,
    "test_acc":     best["acc"],
    "test_f1":      best["f1"],
    "test_auc":     best["auc"],
    "cv_auc":       best["cv"],
}, MODEL_SAVE)

print(f"\n{'='*65}")
print(f"  Saved screener model -> {MODEL_SAVE}")
print(f"  ({best_name}: acc {best['acc']*100:.1f}%, F1 {best['f1']*100:.1f}%, "
      f"AUC {best['auc']*100:.1f}%, CV AUC {best['cv']*100:.1f}%)")
print(f"{'='*65}")
