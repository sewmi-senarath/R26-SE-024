"""
PREP OASIS-1  ->  oasis_cross-sectional.csv   (harmonize for Step 1 merge)
=========================================================================
OASIS-1 (cross-sectional) and OASIS-2 (longitudinal) look almost identical
but encode ONE column differently, which must be fixed before merging:

  • Education
        OASIS-2 EDUC  = actual YEARS of schooling   (6 .. 23)
        OASIS-1 Educ  = a 1-5 CATEGORY code          (1 .. 5)
    Concatenating them raw would make EDUC meaningless. We convert the
    OASIS-1 code to approximate years with the crosswalk below so both
    datasets speak the same units.

  • SES  — both are the same 1-5 Hollingshead scale, so it's left as-is.

We also:
  • derive a SUBJECT-level id (strip the _MRn suffix) so the ~20 duplicate
    "reliability" re-scans group with their own subject and never leak
    across the train/test split;
  • keep only the columns the deploy model uses + the label (CDR).

Output: oasis_cross-sectional.csv  (in this folder), ready for train_merged.py

Run:  .venv-ml/Scripts/python.exe prep_oasis1.py "D:/research/datasets/oasis_cross-sectional-5708aa0a98d82080 1.xlsx"
"""

import sys
import pandas as pd

# Approximate OASIS-1 education-code -> years crosswalk.
#   1 = less than high-school graduate   -> 10
#   2 = high-school graduate             -> 12
#   3 = some college                     -> 14
#   4 = college graduate                 -> 16
#   5 = beyond college                   -> 18
# (Midpoints; an approximation is unavoidable when converting a category to
#  a number — noted openly as a harmonization assumption.)
EDUC_CODE_TO_YEARS = {1: 10, 2: 12, 3: 14, 4: 16, 5: 18}

DEFAULT_SRC = r"D:/research/datasets/oasis_cross-sectional-5708aa0a98d82080 1.xlsx"
OUT = "oasis_cross-sectional.csv"

src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
print(f"Reading OASIS-1 from: {src}")
df = pd.read_excel(src) if src.lower().endswith((".xlsx", ".xls")) else pd.read_csv(src)
print(f"  {len(df)} raw rows")

# Subject-level id: OAS1_0061_MR2 -> OAS1_0061  (so re-scans group together)
df["Subject ID"] = df["ID"].astype(str).str.replace(r"_MR\d+$", "", regex=True)

# Education: 1-5 code -> approximate years, to match OASIS-2's EDUC units
df["EDUC"] = df["Educ"].map(EDUC_CODE_TO_YEARS)

out = df[["Subject ID", "M/F", "Age", "EDUC", "SES", "MMSE", "CDR"]].copy()

# Keep only rows that actually carry a label + the key input (the younger
# OASIS-1 controls have blank CDR/MMSE — same rule train.py already uses).
before = len(out)
out = out.dropna(subset=["CDR", "MMSE"])
print(f"  kept {len(out)} rows with CDR+MMSE (dropped {before - len(out)} unlabeled)")
print(f"  unique subjects: {out['Subject ID'].nunique()}")
print(f"  CDR distribution: {out['CDR'].value_counts().sort_index().to_dict()}")

out.to_csv(OUT, index=False)
print(f"\nWrote -> {OUT}  ({len(out)} rows)  — now run train_merged.py")
