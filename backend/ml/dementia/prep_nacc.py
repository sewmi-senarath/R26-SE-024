"""
PREP NACC UDS  ->  nacc.csv   (harmonize for the 3rd dataset merge)
====================================================================
NACC's Uniform Data Set (UDS) is a large, real, longitudinal Alzheimer's
Disease Research Center cohort. This is the dataset that finally gives us
REAL, substantial `severe` cases — OASIS-1+2 together had only 5.

Source file: a commercial/full NACC UDS export (e.g. commercial_nacc74.csv),
~1,700 columns wide. We read ONLY the 6 columns the model needs — reading
all columns on a ~1GB file would be needlessly slow.

Columns used (from the NACC Researcher's Data Dictionary,
https://www.naccdata.org/data-forms-and-documentation/ ,
form UDS3/UDS4 "header"/"a1"/"b" sections):
    NACCID    subject id (prefix "NACC" + digits)      -> Subject ID
    NACCAGE   age at visit                             -> Age
    NACCSEX   1 = Male, 2 = Female                      -> M/F
    EDUC      years of education (0-36; 99 = unknown)   -> EDUC
    NACCMMSE  MMSE total (0-30; -4/88/95-98 = missing)  -> MMSE
    CDRGLOB   global CDR (0, 0.5, 1, 2, 3; 99 = missing)-> CDR

NACC does NOT collect Hollingshead SES like OASIS does — SES is left blank
here and median-imputed downstream (same as every other non-OASIS source in
train_merged.py). SES's feature importance is already the smallest of the
five deploy features, so this costs little.

Missing-value handling (NACC's own codes, from the Researcher's Guide,
https://www.naccdata.org/the-nacc-researchers-guide/):
    NACCMMSE : keep only 0-30              (drop -4, 88, 95, 96, 97, 98)
    CDRGLOB  : keep only 0, 0.5, 1, 2, 3    (drop 99 = missing)
    NACCSEX  : keep only 1, 2               (drop 8, 9 = missing)
    EDUC     : keep only 0-36               (drop 99 = unknown)
    NACCAGE  : keep only 1-110              (sanity bound)

Run:  .venv-ml/Scripts/python.exe prep_nacc.py "D:/research/commercial_nacc74.csv"
"""

import sys
import pandas as pd

DEFAULT_SRC = "D:/research/commercial_nacc74.csv"
OUT = "nacc.csv"
USECOLS = ["NACCID", "NACCAGE", "NACCSEX", "EDUC", "NACCMMSE", "CDRGLOB"]

src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
print(f"Reading NACC UDS from: {src}")
print("  (reading only 6 of ~1,700 columns for speed)")
df = pd.read_csv(src, usecols=USECOLS, low_memory=False)
print(f"  {len(df)} raw rows, {df['NACCID'].nunique()} unique subjects")

valid_mmse = df["NACCMMSE"].between(0, 30)
valid_cdr  = df["CDRGLOB"].isin([0, 0.5, 1.0, 2.0, 3.0])
valid_sex  = df["NACCSEX"].isin([1, 2])
valid_educ = df["EDUC"].between(0, 36)
valid_age  = df["NACCAGE"].between(1, 110)

before = len(df)
df = df[valid_mmse & valid_cdr & valid_sex & valid_educ & valid_age].copy()
print(f"  kept {len(df)} rows with valid MMSE+CDR+sex+educ+age "
      f"(dropped {before - len(df)} with missing/invalid codes)")
print(f"  unique subjects: {df['NACCID'].nunique()}")

out = pd.DataFrame()
out["Subject ID"] = df["NACCID"]
out["M/F"]  = df["NACCSEX"].map({1: "M", 2: "F"})
out["Age"]  = df["NACCAGE"]
out["EDUC"] = df["EDUC"]
out["SES"]  = pd.NA                     # NACC doesn't collect this — median-imputed downstream
out["MMSE"] = df["NACCMMSE"]
out["CDR"]  = df["CDRGLOB"]

sev = out["CDR"].map({0.0: "none", 0.5: "mild", 1.0: "moderate", 2.0: "severe", 3.0: "severe"})
print("\n  CDR-derived severity distribution:")
print(f"  {sev.value_counts()}")
print(f"\n  severe = {(sev=='severe').sum()} rows "
      f"({(sev=='severe').mean()*100:.1f}%) — vs 5 rows (0.8%) in merged OASIS-1+2")

out.to_csv(OUT, index=False)
print(f"\nWrote -> {OUT}  ({len(out)} rows)  — now run train_merged.py")
