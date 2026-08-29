"""
DIAGNOSTIC: is SES helping or hurting on the merged (OASIS+NACC) dataset?
==========================================================================
NACC doesn't collect Hollingshead SES at all, so for ~99% of the merged
rows SES is a median-imputed CONSTANT, not real information. A constant
can sometimes still help (regularization noise trees ignore) or can hurt
(a feature the model wastes splits on). This script settles it empirically.

READ-ONLY: does not touch dementia_model.pkl. Purely a comparison so you
can decide whether dropping SES (a deploy-contract change to app.py) is
worth doing.

Run:  .venv-ml/Scripts/python.exe test_drop_ses.py
"""

import os
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import GroupShuffleSplit, GroupKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report

CDR_TO_SEVERITY = {0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "severe", 3.0: "severe"}
SOURCES = [
    ("oasis_longitudinal.csv",    "OASIS-2", "O2"),
    ("oasis_cross-sectional.csv", "OASIS-1", "O1"),
    ("oasis3.csv",                "OASIS-3", "O3"),
    ("nacc.csv",                  "NACC",    "N3"),
]
ALIASES = {
    "Age": ["age"], "EDUC": ["educ", "education"], "SES": ["ses"],
    "MMSE": ["mmse"], "CDR": ["cdr"], "Sex": ["m/f", "sex", "gender"],
    "Group": ["subject id", "subjectid", "id"],
}


def _find(lower, cands):
    for c in cands:
        if c in lower:
            return lower[c]
    return None


def load(path, prefix):
    df = pd.read_csv(path)
    lower = {c.lower().strip(): c for c in df.columns}
    resolved = {k: _find(lower, v) for k, v in ALIASES.items()}
    out = pd.DataFrame()
    out["Age"]  = pd.to_numeric(df[resolved["Age"]], errors="coerce")
    out["EDUC"] = pd.to_numeric(df[resolved["EDUC"]], errors="coerce")
    out["SES"]  = pd.to_numeric(df[resolved["SES"]], errors="coerce")
    out["MMSE"] = pd.to_numeric(df[resolved["MMSE"]], errors="coerce")
    out["CDR"]  = pd.to_numeric(df[resolved["CDR"]], errors="coerce")
    sex = df[resolved["Sex"]].astype(str).str.upper()
    out["Sex_M"] = (sex.str[0] == "M").astype(int)
    out["group"] = prefix + "_" + df[resolved["Group"]].astype(str)
    return out


print("=" * 66)
print("  DIAGNOSTIC: does SES help or hurt on the merged dataset?")
print("=" * 66)

frames = []
for fname, label, prefix in SOURCES:
    if os.path.exists(fname):
        frames.append(load(fname, prefix))
        print(f"  loaded {label}: {len(frames[-1])} rows")
df = pd.concat(frames, ignore_index=True)
df = df.dropna(subset=["MMSE", "CDR"]).copy()
df["Age"]  = df["Age"].fillna(df["Age"].median())
df["EDUC"] = df["EDUC"].fillna(df["EDUC"].median())
df["SES_imputed"] = df["SES"].fillna(df["SES"].median())
df["severity"] = df["CDR"].map(CDR_TO_SEVERITY)
df = df.dropna(subset=["severity"]).copy()

pct_real_ses = df["SES"].notna().mean() * 100
print(f"\n  Total rows: {len(df)}  |  SES actually observed (not imputed): {pct_real_ses:.1f}%")

y, groups = df["severity"], df["group"]
gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
gkf = GroupKFold(n_splits=5)

MODELS = {
    "Random Forest": RandomForestClassifier(n_estimators=300, max_depth=6, min_samples_leaf=2,
                                             class_weight="balanced", random_state=42, n_jobs=-1),
    "Extra Trees": ExtraTreesClassifier(n_estimators=300, max_depth=6, min_samples_leaf=2,
                                        class_weight="balanced", random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,
                                                     subsample=0.8, random_state=42),
}


def run(feature_cols, tag):
    X = df[feature_cols]
    tr, te = next(gss.split(X, y, groups))
    Xtr, Xte, ytr, yte = X.iloc[tr], X.iloc[te], y.iloc[tr], y.iloc[te]
    print(f"\n  --- {tag}  (features: {feature_cols}) ---")
    best = None
    for name, m in MODELS.items():
        m.fit(Xtr, ytr)
        pred = m.predict(Xte)
        acc = accuracy_score(yte, pred)
        mf1 = f1_score(yte, pred, average="macro", zero_division=0)
        cv = cross_val_score(m, X, y, groups=groups, cv=gkf, scoring="f1_macro", n_jobs=-1).mean()
        print(f"    {name:<20} acc {acc*100:5.1f}%   macro-F1 {mf1*100:5.1f}%   CV macro-F1 {cv*100:5.1f}%")
        if best is None or mf1 > best[1]:
            best = (name, mf1, acc, cv, m, pred, yte)
    return best


with_ses    = run(["Age", "EDUC", "SES_imputed", "MMSE", "Sex_M"], "WITH SES (current deploy set)")
without_ses = run(["Age", "EDUC", "MMSE", "Sex_M"],                 "WITHOUT SES")

print("\n" + "=" * 66)
print("  RESULT")
print("=" * 66)
print(f"  {'':<14}{'Accuracy':>10}{'Macro-F1':>11}{'CV Macro-F1':>14}")
print(f"  {'with SES':<14}{with_ses[2]*100:9.1f}%{with_ses[1]*100:10.1f}%{with_ses[3]*100:13.1f}%")
print(f"  {'without SES':<14}{without_ses[2]*100:9.1f}%{without_ses[1]*100:10.1f}%{without_ses[3]*100:13.1f}%")
d = (without_ses[3] - with_ses[3]) * 100
print(f"  CV macro-F1 change from dropping SES: {d:+.1f} pts")
if d > 0.3:
    print("\n  -> SES is HURTING. Dropping it looks like a real, free improvement.")
elif d < -0.3:
    print("\n  -> SES is HELPING (even mostly-imputed). Keep it.")
else:
    print("\n  -> Essentially NO DIFFERENCE. Keep or drop for simplicity, not accuracy.")
print("=" * 66)
