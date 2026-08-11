"""
DEMENTIA SEVERITY PREDICTION - TRAINING
========================================
Dataset : OASIS Longitudinal (Open Access Series of Imaging Studies)
Source  : https://www.kaggle.com/datasets/jboysen/mri-and-alzheimers?select=oasis_longitudinal.csv
          (also mirrored at github.com/deepak525/Dementia-Classification-Compare-Classifiers)

Why this dataset: it has MMSE (0-30, same scale MemoCare's cognitive
assessment already uses) + CDR (Clinical Dementia Rating) + repeated
visits per subject -> perfect for both this classifier AND the later
LSTM/GRU trajectory model (Phase 2), since it already has multiple
timestamped visits per patient.
"""

import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import GroupShuffleSplit, GroupKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

DATA_PATH  = "oasis_longitudinal.csv"
MODEL_SAVE = "dementia_model.pkl"

print("=" * 65)
print("  DEMENTIA SEVERITY PREDICTION - TRAINING")
print("=" * 65)

# STEP 1 - LOAD
df = pd.read_csv(DATA_PATH)
print(f"\nLoaded {len(df)} visits across {df['Subject ID'].nunique()} subjects")

# STEP 2 - CLEAN
# Drop rows with missing MMSE (only 2 rows) - MMSE is our key feature
df = df.dropna(subset=["MMSE"]).copy()

# SES (socioeconomic status) has 19 missing values - impute with median
df["SES"] = df["SES"].fillna(df["SES"].median())

# Hand is constant ('R' for every row in this dataset) - no signal, drop it
df = df.drop(columns=["Hand"])

# Encode sex
df["Sex_M"] = (df["M/F"] == "M").astype(int)

print(f"After cleaning: {len(df)} visits")

# STEP 3 - LABEL: map CDR -> severity (matches MemoCare's severity enum exactly)
CDR_TO_SEVERITY = {0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "severe"}
df["severity"] = df["CDR"].map(CDR_TO_SEVERITY)

print("\nSeverity label distribution:")
counts = df["severity"].value_counts()
for label in ["none", "mild", "moderate", "severe"]:
    n = counts.get(label, 0)
    print(f"  {label:<10} {n:>4} visits  ({n/len(df)*100:.1f}%)")
print("\n  NOTE: 'severe' has very few samples (real MMSE/CDR datasets are like")
print("  this - severely impaired patients are rarely enrolled in outpatient")
print("  longitudinal studies). Metrics below use macro-F1 (not accuracy) and")
print("  class_weight='balanced' to avoid the model ignoring rare classes.")

# STEP 4 - FEATURES
# Two feature sets are built on purpose:
#   research_features -> everything OASIS provides (MRI-derived volumes included)
#                         used to show the full picture / for the report.
#   deploy_features    -> ONLY fields MemoCare's app can actually supply at
#                         inference time (no MRI scanner in a caregiving app!).
#                         This is the one saved for the Flask API.
research_features = ["Age", "EDUC", "SES", "MMSE", "Sex_M", "eTIV", "nWBV", "ASF"]
deploy_features   = ["Age", "EDUC", "SES", "MMSE", "Sex_M"]

X_research = df[research_features]
X_deploy   = df[deploy_features]
y          = df["severity"]
groups     = df["Subject ID"]  # group by subject so the same patient never
                                # appears in both train and test (data leakage)

def train_and_eval(X, y, groups, tag):
    print(f"\n{'-'*65}")
    print(f"  Feature set: {tag}  ({list(X.columns)})")
    print(f"{'-'*65}")

    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    groups_train = groups.iloc[train_idx]

    print(f"  Train: {len(X_train)} visits ({groups_train.nunique()} subjects) | "
          f"Test: {len(X_test)} visits ({groups.iloc[test_idx].nunique()} subjects)")

    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=300, max_depth=6, min_samples_leaf=2,
            class_weight="balanced", random_state=42, n_jobs=-1),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=300, max_depth=6, min_samples_leaf=2,
            class_weight="balanced", random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.05,
            subsample=0.8, random_state=42),
    }

    gkf = GroupKFold(n_splits=5)
    results = {}
    print(f"\n  {'Model':<20}{'Test Acc':>10}{'Test MacroF1':>14}{'CV MacroF1':>13}")
    for name, m in models.items():
        m.fit(X_train, y_train)
        pred = m.predict(X_test)
        acc  = accuracy_score(y_test, pred)
        mf1  = f1_score(y_test, pred, average="macro", zero_division=0)
        cv   = cross_val_score(m, X, y, groups=groups, cv=gkf,
                                scoring="f1_macro")
        print(f"  {name:<20}{acc*100:>9.1f}%{mf1*100:>13.1f}%{cv.mean()*100:>12.1f}%")
        results[name] = {"model": m, "acc": acc, "mf1": mf1, "cv": cv.mean(), "pred": pred}

    best_name = max(results, key=lambda k: results[k]["mf1"])
    best = results[best_name]
    print(f"\n  BEST MODEL: {best_name}  (selected on test macro-F1)")
    print(f"\n  Classification report:")
    print(classification_report(y_test, best["pred"], zero_division=0))

    labels = ["none", "mild", "moderate", "severe"]
    cm = confusion_matrix(y_test, best["pred"], labels=labels)
    cm_df = pd.DataFrame(cm,
        index=[f"Actual {l}" for l in labels],
        columns=[f"Pred {l}" for l in labels])
    print("  Confusion matrix:")
    print(cm_df.to_string())

    if hasattr(best["model"], "feature_importances_"):
        print("\n  Feature importance:")
        imp = pd.Series(best["model"].feature_importances_, index=X.columns).sort_values(ascending=False)
        for feat, val in imp.items():
            bar = "#" * int(val * 60)
            print(f"    {bar:<20} {val:.3f}  {feat}")

    return best_name, best, X.columns.tolist()

# STEP 5 - TRAIN BOTH FEATURE SETS
print("\n" + "=" * 65)
print("  MODEL A: RESEARCH (all OASIS features, incl. MRI volumes)")
print("=" * 65)
research_name, research_best, research_cols = train_and_eval(X_research, y, groups, "research")

print("\n" + "=" * 65)
print("  MODEL B: DEPLOYABLE (only features MemoCare's app can supply)")
print("=" * 65)
deploy_name, deploy_best, deploy_cols = train_and_eval(X_deploy, y, groups, "deploy")

# STEP 6 - SAVE THE DEPLOYABLE MODEL (this is what app.py will load)
joblib.dump({
    "model":        deploy_best["model"],
    "feature_cols": deploy_cols,
    "model_name":   deploy_name,
    "test_acc":     deploy_best["acc"],
    "test_macro_f1": deploy_best["mf1"],
    "cv_macro_f1":  deploy_best["cv"],
    "label_map":    CDR_TO_SEVERITY,
    "severity_order": ["none", "mild", "moderate", "severe"],
}, MODEL_SAVE)

print(f"\n{'='*65}")
print(f"  Saved deployable model -> {MODEL_SAVE}")
print(f"  ({deploy_name}: test acc {deploy_best['acc']*100:.1f}%, "
      f"macro-F1 {deploy_best['mf1']*100:.1f}%, CV macro-F1 {deploy_best['cv']*100:.1f}%)")
print(f"{'='*65}")
