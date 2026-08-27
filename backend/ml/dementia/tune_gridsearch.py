"""
GRIDSEARCH HYPERPARAMETER TUNING  (honest accuracy-boost attempt)
=================================================================
Tunes the deployed 3-class model (merged OASIS-1 + OASIS-2, moderate+severe
combined) with a leakage-safe GroupKFold GridSearchCV.

SAFETY: it overwrites dementia_model.pkl ONLY IF the tuned model beats the
current default-hyperparameter model on CV macro-F1. If tuning doesn't help,
the existing model is left exactly as-is (nothing to undo).

Run:  .venv-ml/Scripts/python.exe tune_gridsearch.py
"""

import os
import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import GroupShuffleSplit, GroupKFold, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report

DEPLOY  = ["Age", "EDUC", "SES", "MMSE", "Sex_M"]
ORDER   = ["none", "mild", "moderate"]                 # 3-class (severe folded in)
CDR_MAP = {0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "moderate", 3.0: "moderate"}
MODEL_SAVE = "dementia_model.pkl"


def load(path, prefix):
    df = pd.read_csv(path)
    lower = {c.lower().strip(): c for c in df.columns}
    def col(*names):
        for n in names:
            if n in lower:
                return df[lower[n]]
        return None
    out = pd.DataFrame()
    out["Age"]  = pd.to_numeric(col("age"), errors="coerce")
    out["EDUC"] = pd.to_numeric(col("educ", "education"), errors="coerce")
    out["SES"]  = pd.to_numeric(col("ses"), errors="coerce")
    out["MMSE"] = pd.to_numeric(col("mmse"), errors="coerce")
    out["CDR"]  = pd.to_numeric(col("cdr"), errors="coerce")
    sex = col("m/f", "sex", "gender").astype(str).str.upper()
    out["Sex_M"] = (sex.str[0] == "M").astype(int)
    out["group"] = prefix + "_" + col("subject id", "id").astype(str)
    return out


# ── Build the same merged 3-class dataset the deployed model uses ───────────
frames = [load("oasis_longitudinal.csv", "O2")]
if os.path.exists("oasis_cross-sectional.csv"):
    frames.append(load("oasis_cross-sectional.csv", "O1"))
df = pd.concat(frames, ignore_index=True)
df = df.dropna(subset=["MMSE", "CDR"]).copy()
df["SES"]  = df["SES"].fillna(df["SES"].median())
df["EDUC"] = df["EDUC"].fillna(df["EDUC"].median())
df["Age"]  = df["Age"].fillna(df["Age"].median())
df["severity"] = df["CDR"].map(CDR_MAP)
df = df.dropna(subset=["severity"]).copy()

X, y, groups = df[DEPLOY], df["severity"], df["group"]
gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
tr, te = next(gss.split(X, y, groups))
Xtr, Xte, ytr, yte = X.iloc[tr], X.iloc[te], y.iloc[tr], y.iloc[te]
gtr = groups.iloc[tr]
gkf = GroupKFold(n_splits=5)

print("=" * 60)
print("  GRIDSEARCH TUNING — merged 3-class Random Forest")
print("=" * 60)
print(f"  Data: {len(df)} rows, {groups.nunique()} subjects, classes {ORDER}")


def evaluate(model, tag):
    model.fit(Xtr, ytr)
    pred = model.predict(Xte)
    acc = accuracy_score(yte, pred)
    mf1 = f1_score(yte, pred, average="macro", zero_division=0)
    cv  = cross_val_score(model, X, y, groups=groups, cv=gkf, scoring="f1_macro", n_jobs=-1).mean()
    print(f"  {tag:<24} acc {acc*100:5.1f}%   macro-F1 {mf1*100:5.1f}%   CV macro-F1 {cv*100:5.1f}%")
    return acc, mf1, cv, model


# ── Baseline: the current default hyperparameters ───────────────────────────
print("\n  BASELINE (current default hyperparameters):")
base = RandomForestClassifier(n_estimators=300, max_depth=6, min_samples_leaf=2,
                              class_weight="balanced", random_state=42, n_jobs=1)
b_acc, b_mf1, b_cv, _ = evaluate(base, "default RF")

# ── GridSearchCV (leakage-safe: GroupKFold on the training split only) ──────
grid = {
    "n_estimators":     [200, 300, 500],
    "max_depth":        [4, 6, 8, 12, None],
    "min_samples_leaf": [1, 2, 4],
    "max_features":     ["sqrt", "log2", None],
}
n_combos = np.prod([len(v) for v in grid.values()])
print(f"\n  Running GridSearchCV: {n_combos} combinations x 5 folds ...")
gs = GridSearchCV(
    RandomForestClassifier(class_weight="balanced", random_state=42, n_jobs=1),
    grid, cv=gkf, scoring="f1_macro", n_jobs=-1)
gs.fit(Xtr, ytr, groups=gtr)
print(f"  Best params: {gs.best_params_}")

best = RandomForestClassifier(class_weight="balanced", random_state=42, n_jobs=1, **gs.best_params_)
print("\n  TUNED:")
t_acc, t_mf1, t_cv, best_model = evaluate(best, "tuned RF")

print("\n  Per-class report (tuned, held-out real patients):")
print(classification_report(yte, best_model.predict(Xte), zero_division=0))

# ── Decide: keep only if it genuinely improved ──────────────────────────────
print("=" * 60)
print("  RESULT")
print("=" * 60)
print(f"  {'':<14}{'Accuracy':>10}{'Macro-F1':>11}{'CV Macro-F1':>14}")
print(f"  {'default':<14}{b_acc*100:9.1f}%{b_mf1*100:10.1f}%{b_cv*100:13.1f}%")
print(f"  {'tuned':<14}{t_acc*100:9.1f}%{t_mf1*100:10.1f}%{t_cv*100:13.1f}%")
print(f"  CV macro-F1 change: {(t_cv - b_cv)*100:+.1f} pts")

if t_cv > b_cv + 1e-9:
    joblib.dump({
        "model":         best_model,
        "feature_cols":  DEPLOY,
        "model_name":    "Random Forest (3-class, tuned)",
        "test_acc":      t_acc,
        "test_macro_f1": t_mf1,
        "cv_macro_f1":   t_cv,
        "label_map":     CDR_MAP,
        "severity_order": ORDER,
        "trained_on":    ["OASIS-2", "OASIS-1", "merge-severe", "gridsearch"],
    }, MODEL_SAVE)
    print(f"\n  IMPROVED -> saved tuned model to {MODEL_SAVE}")
else:
    print(f"\n  No improvement -> {MODEL_SAVE} left UNCHANGED (current model kept).")
print("=" * 60)
