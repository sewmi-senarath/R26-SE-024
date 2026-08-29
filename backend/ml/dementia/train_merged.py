"""
DEMENTIA SEVERITY — MULTI-DATASET MERGE + TRAINING  (Steps 1 & 2)
================================================================
Extends train.py to combine multiple OASIS datasets so the model sees more
subjects and its metrics become more stable / trustworthy.

WHAT IT MERGES (auto-detected — it uses whatever is present in this folder):
  • oasis_longitudinal.csv     -> OASIS-2  (you already have this)          [always]
  • oasis_cross-sectional.csv  -> OASIS-1  (STEP 1: same Kaggle download)   [if present]
  • oasis3.csv                 -> OASIS-3  (STEP 2: harmonized export)       [if present]

HOW TO ADD THE DATA
  STEP 1 (OASIS-1): on the same Kaggle page you already used
      (jboysen/mri-and-alzheimers), download `oasis_cross-sectional.csv`
      and drop it in this folder. Re-run. Done.
  STEP 2 (OASIS-3): register at https://sites.wustl.edu/oasisbrains/, accept
      the data-use agreement, export the clinical + cognitive tables, and
      join them per subject into a single CSV named `oasis3.csv` with (at
      least) these columns — names are matched case-insensitively and a few
      aliases are accepted:  Age, EDUC, SES, MMSE, CDR, M/F, Subject ID.

WHY ONLY THESE 5 FEATURES
  We train on the DEPLOY feature set only — Age, EDUC, SES, MMSE, Sex_M —
  the same fields app.py can supply at inference. That also side-steps the
  MRI site/scanner batch-effects you'd hit if you merged eTIV/nWBV/ASF
  across studies.

Run:  .venv-ml/Scripts/python.exe train_merged.py
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import GroupShuffleSplit, GroupKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

# SMOTE (Step 3B) is optional — enabled with the --smote flag. It ONLY adds
# synthetic minority-class rows; it never removes real data.
try:
    from imblearn.over_sampling import SMOTE
    from imblearn.pipeline import Pipeline as ImbPipeline
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

USE_SMOTE    = "--smote" in sys.argv
# Step 3A: fold the near-empty `severe` class into `moderate` so the rare class
# becomes learnable AND measurable. Keeps the label app-compatible (the app
# already handles none/mild/moderate) — it simply never emits `severe`.
MERGE_SEVERE = "--merge-severe" in sys.argv

MODEL_SAVE   = "dementia_model.pkl"
DEPLOY_FEATURES = ["Age", "EDUC", "SES", "MMSE", "Sex_M"]
SEVERITY_ORDER  = ["none", "mild", "moderate", "severe"]
CDR_TO_SEVERITY = {0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "severe", 3.0: "severe"}

# 3-class variant (severe folded into moderate = "moderate or worse")
MERGED_ORDER    = ["none", "mild", "moderate"]
MERGED_CDR_MAP  = {0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "moderate", 3.0: "moderate"}

# Each source: filename -> (human label, id-prefix so subject ids never
# collide across datasets — critical for the leakage-safe group split).
SOURCES = [
    ("oasis_longitudinal.csv",    "OASIS-2", "O2"),
    ("oasis_cross-sectional.csv", "OASIS-1", "O1"),
    ("oasis3.csv",                "OASIS-3", "O3"),
    ("nacc.csv",                  "NACC",    "N3"),  # from prep_nacc.py — real severe cases
]

# Case-insensitive column resolution + a few real-world aliases so OASIS-1's
# `Educ`, OASIS-3 exports, etc. all line up on the same canonical names.
ALIASES = {
    "Age":   ["age"],
    "EDUC":  ["educ", "education", "educationyears", "education_years"],
    "SES":   ["ses", "socioeconomicstatus"],
    "MMSE":  ["mmse", "mmscore"],
    "CDR":   ["cdr", "cdrtot", "cdglobal"],
    "Sex":   ["m/f", "sex", "gender"],
    "Group": ["subject id", "subjectid", "id", "oasisid", "oasis_id", "subject"],
}


def _find(df_cols_lower, candidates):
    for cand in candidates:
        if cand in df_cols_lower:
            return df_cols_lower[cand]
    return None


def load_and_standardize(path, label, prefix):
    """Read one dataset and reduce it to the canonical columns we train on."""
    df = pd.read_csv(path)
    lower = {c.lower().strip(): c for c in df.columns}

    resolved = {canon: _find(lower, cands) for canon, cands in ALIASES.items()}
    missing = [c for c in ["Age", "EDUC", "SES", "MMSE", "CDR", "Sex"] if resolved[c] is None]
    if missing:
        print(f"  !! {label}: skipped — missing required columns {missing}")
        return None

    out = pd.DataFrame()
    out["Age"]  = pd.to_numeric(df[resolved["Age"]], errors="coerce")
    out["EDUC"] = pd.to_numeric(df[resolved["EDUC"]], errors="coerce")
    out["SES"]  = pd.to_numeric(df[resolved["SES"]], errors="coerce")
    out["MMSE"] = pd.to_numeric(df[resolved["MMSE"]], errors="coerce")
    out["CDR"]  = pd.to_numeric(df[resolved["CDR"]], errors="coerce")

    sex = df[resolved["Sex"]].astype(str).str.strip().str.upper()
    out["Sex_M"] = (sex.str[0] == "M").astype(int)

    # group id: real one if available, else one row = one subject
    if resolved["Group"] is not None:
        grp = df[resolved["Group"]].astype(str)
    else:
        grp = pd.Series([str(i) for i in range(len(df))])
    out["group"]  = prefix + "_" + grp
    out["source"] = label
    return out


def assemble():
    frames, found = [], []
    for fname, label, prefix in SOURCES:
        if os.path.exists(fname):
            std = load_and_standardize(fname, label, prefix)
            if std is not None:
                frames.append(std)
                found.append((label, len(std)))
    if not frames:
        print("No dataset CSVs found in this folder. Need at least oasis_longitudinal.csv.")
        sys.exit(1)
    return pd.concat(frames, ignore_index=True), found


def clean(df):
    """Same cleaning contract as train.py, applied to the merged frame."""
    df = df.dropna(subset=["MMSE", "CDR"]).copy()          # need the input + the label
    df["SES"] = df["SES"].fillna(df["SES"].median())        # impute SES (robust median)
    df["EDUC"] = df["EDUC"].fillna(df["EDUC"].median())     # impute the odd missing EDUC
    df["Age"] = df["Age"].fillna(df["Age"].median())
    df["severity"] = df["CDR"].map(CDR_TO_SEVERITY)         # CDR -> ordered severity band
    df = df.dropna(subset=["severity"]).copy()              # drop unmappable CDRs
    return df


def train_and_eval(df, tag):
    """Train the 3 tree ensembles on the deploy features; return the best."""
    X = df[DEPLOY_FEATURES]
    y = df["severity"]
    groups = df["group"]

    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

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
    for name, m in models.items():
        m.fit(X_train, y_train)
        pred = m.predict(X_test)
        acc  = accuracy_score(y_test, pred)
        mf1  = f1_score(y_test, pred, average="macro", zero_division=0)
        cv   = cross_val_score(m, X, y, groups=groups, cv=gkf, scoring="f1_macro").mean()
        results[name] = {"model": m, "acc": acc, "mf1": mf1, "cv": cv, "pred": pred}

    best_name = max(results, key=lambda k: results[k]["mf1"])
    best = results[best_name]
    best.update(name=best_name, y_test=y_test)
    return best


def train_and_eval_smote(df):
    """Same as train_and_eval, but SMOTE-oversamples the minority classes
    INSIDE each training fold (via an imblearn Pipeline) so no synthetic row
    ever reaches a test fold — the leakage-safe way. Real rows are only added
    to, never removed. Evaluation is always on REAL held-out patients."""
    X = df[DEPLOY_FEATURES]
    y = df["severity"]
    groups = df["group"]

    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # k_neighbors must be smaller than the rarest class in the TRAIN split.
    min_class = int(y_train.value_counts().min())
    k = max(1, min(5, min_class - 1))
    counts_before = y_train.value_counts().reindex(SEVERITY_ORDER).fillna(0).astype(int).to_dict()
    _, y_res = SMOTE(random_state=42, k_neighbors=k).fit_resample(X_train, y_train)
    counts_after = pd.Series(y_res).value_counts().reindex(SEVERITY_ORDER).fillna(0).astype(int).to_dict()
    print(f"  SMOTE k_neighbors={k}  (rarest training class has {min_class} real samples)")
    print(f"  Train counts BEFORE SMOTE: {counts_before}")
    print(f"  Train counts AFTER  SMOTE: {counts_after}   <- synthetic minority rows added")

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
    for name, m in models.items():
        pipe = ImbPipeline([
            ("smote", SMOTE(random_state=42, k_neighbors=k)),
            ("clf", m),
        ])
        pipe.fit(X_train, y_train)                       # SMOTE runs on train only
        pred = pipe.predict(X_test)                      # predicted on REAL test
        acc = accuracy_score(y_test, pred)
        mf1 = f1_score(y_test, pred, average="macro", zero_division=0)
        cv  = cross_val_score(pipe, X, y, groups=groups, cv=gkf,
                              scoring="f1_macro", error_score=np.nan)
        results[name] = {
            # Save the bare fitted classifier (already trained on the resampled
            # data) so the served model carries no imblearn dependency.
            "model": pipe.named_steps["clf"],
            "acc": acc, "mf1": mf1, "cv": float(np.nanmean(cv)), "pred": pred,
        }

    best_name = max(results, key=lambda k: results[k]["mf1"])
    best = results[best_name]
    best.update(name=f"{best_name} + SMOTE", y_test=y_test)
    return best


def summarize(df, found):
    print("\n  Datasets merged:")
    for label, n in found:
        print(f"    {label:<9} {n:>5} rows")
    print(f"    {'TOTAL':<9} {len(df):>5} rows  ({df['group'].nunique()} unique subjects)")
    print("\n  Severity distribution after cleaning:")
    counts = df["severity"].value_counts()
    for lvl in SEVERITY_ORDER:
        n = int(counts.get(lvl, 0))
        print(f"    {lvl:<10} {n:>5}  ({n/len(df)*100:4.1f}%)")


print("=" * 66)
print("  DEMENTIA SEVERITY — MULTI-DATASET MERGE (Steps 1 & 2)")
print("=" * 66)

merged_raw, found = assemble()
merged = clean(merged_raw)
summarize(merged, found)

# ── Before/after: OASIS-2 alone vs the full merge ──────────────────────────
oasis2_only = merged[merged["source"] == "OASIS-2"]

print("\n" + "-" * 66)
print("  BEFORE — OASIS-2 only")
print("-" * 66)
before = train_and_eval(oasis2_only, "OASIS-2 only")
print(f"  Best: {before['name']:<16}  acc {before['acc']*100:5.1f}%   "
      f"macro-F1 {before['mf1']*100:5.1f}%   CV macro-F1 {before['cv']*100:5.1f}%")

print("\n" + "-" * 66)
print(f"  AFTER  — merged ({' + '.join(l for l, _ in found)})")
print("-" * 66)
after = train_and_eval(merged, "merged")
print(f"  Best: {after['name']:<16}  acc {after['acc']*100:5.1f}%   "
      f"macro-F1 {after['mf1']*100:5.1f}%   CV macro-F1 {after['cv']*100:5.1f}%")

# ── Optional SMOTE arm (Step 3B) — enabled with --smote ─────────────────────
smote = None
if USE_SMOTE:
    print("\n" + "-" * 66)
    print("  AFTER  — merged + SMOTE (synthetic minority oversampling)")
    print("-" * 66)
    if not HAS_SMOTE:
        print("  imbalanced-learn not installed — run: pip install imbalanced-learn")
    else:
        smote = train_and_eval_smote(merged)
        print(f"  Best: {smote['name']:<20}  acc {smote['acc']*100:5.1f}%   "
              f"macro-F1 {smote['mf1']*100:5.1f}%   CV macro-F1 {smote['cv']*100:5.1f}%")

# ── Optional 3-class arm (Step 3A) — enabled with --merge-severe ─────────────
merged3 = None
if MERGE_SEVERE:
    print("\n" + "-" * 66)
    print("  AFTER  — merged, moderate+severe combined into one class (3-class)")
    print("-" * 66)
    m3 = merged.copy()
    m3["severity"] = m3["CDR"].map(MERGED_CDR_MAP)      # re-label from CDR
    m3 = m3.dropna(subset=["severity"])
    dist = m3["severity"].value_counts().reindex(MERGED_ORDER).fillna(0).astype(int).to_dict()
    print(f"  Class distribution now: {dist}  (severe folded into moderate)")
    merged3 = train_and_eval(m3, "merged 3-class")
    merged3["name"] = f"{merged3['name']} (3-class)"
    print(f"  Best: {merged3['name']:<24}  acc {merged3['acc']*100:5.1f}%   "
          f"macro-F1 {merged3['mf1']*100:5.1f}%   CV macro-F1 {merged3['cv']*100:5.1f}%")

# The model we report on / save. Priority: 3-class > SMOTE > plain merge.
final       = merged3 if merged3 is not None else (smote if smote is not None else after)
final_order = MERGED_ORDER if merged3 is not None else SEVERITY_ORDER
final_map   = MERGED_CDR_MAP if merged3 is not None else CDR_TO_SEVERITY

print(f"\n  Per-class report ({final['name']}, on REAL held-out patients):")
print(classification_report(final["y_test"], final["pred"], zero_division=0))

cm = confusion_matrix(final["y_test"], final["pred"], labels=final_order)
print("  Confusion matrix:")
print(pd.DataFrame(cm,
      index=[f"actual {l}" for l in final_order],
      columns=[f"pred {l}" for l in final_order]).to_string())

# ── Effect summary ─────────────────────────────────────────────────────────
print("\n" + "=" * 66)
print("  EFFECT")
print("=" * 66)
if len(found) == 1 and not USE_SMOTE:
    print("  Only OASIS-2 found, so 'before' and 'after' are identical.")
    print("  Add oasis_cross-sectional.csv (Step 1) / oasis3.csv (Step 2) and re-run.")
else:
    merged_label = "+ " + " + ".join(l for l, _ in found if l != "OASIS-2")
    print(f"  {'':<22}{'Accuracy':>10}{'Macro-F1':>11}{'CV Macro-F1':>14}")
    print(f"  {'OASIS-2 only':<22}{before['acc']*100:9.1f}%{before['mf1']*100:10.1f}%{before['cv']*100:13.1f}%")
    print(f"  {merged_label:<22}{after['acc']*100:9.1f}%{after['mf1']*100:10.1f}%{after['cv']*100:13.1f}%")
    if smote is not None:
        print(f"  {'+ SMOTE':<22}{smote['acc']*100:9.1f}%{smote['mf1']*100:10.1f}%{smote['cv']*100:13.1f}%")
    if merged3 is not None:
        print(f"  {'+ merge severe (3-cls)':<22}{merged3['acc']*100:9.1f}%{merged3['mf1']*100:10.1f}%{merged3['cv']*100:13.1f}%")
    print("  (CV macro-F1 is the number to trust. Check the per-class report above —")
    print("   a class only counts as 'learned' if it has real held-out support AND")
    print("   decent recall, not just a non-zero row in this table.)")

# ── Save the chosen deploy model (this is what app.py loads) ────────────────
joblib.dump({
    "model":         final["model"],
    "feature_cols":  DEPLOY_FEATURES,
    "model_name":    final["name"],
    "test_acc":      final["acc"],
    "test_macro_f1": final["mf1"],
    "cv_macro_f1":   final["cv"],
    "label_map":     final_map,
    "severity_order": final_order,
    "trained_on":    [l for l, _ in found]
                     + (["SMOTE"] if final is smote else [])
                     + (["merge-severe"] if final is merged3 else []),
}, MODEL_SAVE)

extra = (" + SMOTE oversampling" if final is smote else
         " + moderate/severe merged" if final is merged3 else "")
print(f"\n  Saved -> {MODEL_SAVE}  ({final['name']}, "
      f"trained on {', '.join(l for l, _ in found)}{extra})")
print("=" * 66)
