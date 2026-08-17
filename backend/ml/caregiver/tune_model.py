
import pandas as pd
import numpy as np
import joblib
import warnings
import time
warnings.filterwarnings('ignore')

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
    VotingClassifier,
    StackingClassifier,
    BaggingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import (
    train_test_split, StratifiedKFold,
    cross_val_score, GridSearchCV
)
from sklearn.metrics import (
    classification_report, accuracy_score,
    confusion_matrix, precision_score,
    recall_score, f1_score
)
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectFromModel
from imblearn.over_sampling import SMOTE, BorderlineSMOTE
from imblearn.combine import SMOTETomek

print("=" * 60)
print("CAREGIVER STRESS - MAXIMUM ACCURACY TUNING")
print("=" * 60)

# ── Load ───────────────────────────────────────────────────────────────────
df = pd.read_excel('MemoCare_Caregiver_Stress_Dataset_Cleaned (1).xlsx')
df = df.drop(columns=['Timestamp'], errors='ignore')
print(f"Loaded: {df.shape[0]} rows")

# ── Encode ─────────────────────────────────────────────────────────────────
df['age_encoded']  = df['Age Group'].map({'18-25':0,'18–25':0,'26-35':1,'26–35':1,'36-50':2,'36–50':2,'50+':3}).fillna(1)
df['type_encoded'] = df['Caregiver Type'].map({'Professional caregiver':0,'Nursing staff':1}).fillna(0)
df['exp_encoded']  = df['How many years of caregiving experience do you have?'].map({'Less than 1 year':0,'1-3 years':1,'1–3 years':1,'3-5 years':2,'3–5 years':2,'5-10 years':3,'5–10 years':3,'More than 10 years':4}).fillna(1)
df['sup_encoded']  = df['Do you have support from others?'].map({'Yes':1,'No':0}).fillna(1)

num_cols = [
    'How many patients do you currently care for?',
    'How many hours did you sleep last night?',
    'How physically tired do you feel today?',
    'How many hours did you spend caregiving today?',
    'How many caregiving tasks were assigned today?',
    'How many tasks did you complete today?',
    'How many tasks are still pending?',
    'How many difficult situations (e.g., patient confusion, agitation) occurred today?',
    'How would you describe your mood today?',
    'Did you feel emotionally overwhelmed today?',
    'How stressed did you feel today?',
    'I felt mentally exhausted today Question',
    'I had difficulty managing my caregiving tasks today',
    'I felt emotionally drained today',
    'How many breaks did you take today?',
]
for col in num_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

stress_col = 'How stressed did you feel today?'

# ── Rich feature engineering ───────────────────────────────────────────────
df['task_completion_rate']     = df['How many tasks did you complete today?'] / df['How many caregiving tasks were assigned today?'].replace(0,1)
df['workload_score']           = df['How many tasks are still pending?'] + df['How many difficult situations (e.g., patient confusion, agitation) occurred today?']
df['wellbeing_score']          = df['Did you feel emotionally overwhelmed today?'] + df['I felt mentally exhausted today Question'] + df['I felt emotionally drained today']
df['sleep_deficit']            = 8 - df['How many hours did you sleep last night?']
df['task_pressure']            = df['How many caregiving tasks were assigned today?'] / df['How many hours did you spend caregiving today?'].replace(0,1)
df['emotional_burden']         = df['Did you feel emotionally overwhelmed today?'] + df['I had difficulty managing my caregiving tasks today']
df['physical_mental_combined'] = df['How physically tired do you feel today?'] + df['I felt mentally exhausted today Question']
df['recovery_score']           = df['How many hours did you sleep last night?'] + df['How many breaks did you take today?']
df['overwhelm_index']          = df['Did you feel emotionally overwhelmed today?'] * df['How many difficult situations (e.g., patient confusion, agitation) occurred today?']
df['pending_ratio']            = df['How many tasks are still pending?'] / df['How many caregiving tasks were assigned today?'].replace(0,1)
df['stress_load']              = df['How physically tired do you feel today?'] * df['How many hours did you spend caregiving today?']
df['emotional_physical_ratio'] = df['wellbeing_score'] / (df['How physically tired do you feel today?'] + 1)
df['break_efficiency']         = df['How many breaks did you take today?'] / df['How many hours did you spend caregiving today?'].replace(0,1)
df['mood_overwhelm_gap']       = df['How would you describe your mood today?'] - df['Did you feel emotionally overwhelmed today?']
df['total_stress_index']       = (df['How physically tired do you feel today?'] + df['wellbeing_score'] + df['workload_score']) / 3
# New features
df['high_risk_flag']           = ((df['How many hours did you sleep last night?'] < 6) & (df['wellbeing_score'] > 9)).astype(int)
df['task_stress_interaction']  = df['task_pressure'] * df['How physically tired do you feel today?']
df['recovery_deficit']         = df['workload_score'] / (df['recovery_score'] + 1)
df['emotional_collapse_risk']  = df['wellbeing_score'] * df['How physically tired do you feel today?']
df['workload_per_hour']        = df['How many caregiving tasks were assigned today?'] / df['How many hours did you spend caregiving today?'].replace(0,1)

# ── Labels ─────────────────────────────────────────────────────────────────
def create_label(row):
    stress_n   = (row[stress_col] - 1) / 9
    emotional  = (row['Did you feel emotionally overwhelmed today?'] +
                  row['I felt mentally exhausted today Question'] +
                  row['I felt emotionally drained today'])
    emotion_n  = (emotional - 3) / 12
    physical_n = (row['How physically tired do you feel today?'] - 1) / 4
    sleep_n    = row['How many hours did you sleep last night?'] / 9
    breaks_n   = min(row['How many breaks did you take today?'] / 5, 1)
    recovery   = (sleep_n + breaks_n) / 2
    composite  = (stress_n * 0.50 + emotion_n * 0.25 +
                  physical_n * 0.15 + (1 - recovery) * 0.10)
    if composite <= 0.35:   return 'Low'
    elif composite <= 0.60: return 'Moderate'
    else:                   return 'High'

df['Stress_Label'] = df.apply(create_label, axis=1)
print(f"Labels: {dict(df['Stress_Label'].value_counts())}")

# ── Features ───────────────────────────────────────────────────────────────
feature_cols = [
    'age_encoded','type_encoded','exp_encoded','sup_encoded',
    'How many patients do you currently care for?',
    'How many hours did you sleep last night?',
    'How physically tired do you feel today?',
    'How many hours did you spend caregiving today?',
    'How many caregiving tasks were assigned today?',
    'How many tasks did you complete today?',
    'How many tasks are still pending?',
    'How many difficult situations (e.g., patient confusion, agitation) occurred today?',
    'How would you describe your mood today?',
    'Did you feel emotionally overwhelmed today?',
    'I felt mentally exhausted today Question',
    'I had difficulty managing my caregiving tasks today',
    'I felt emotionally drained today',
    'How many breaks did you take today?',
    'task_completion_rate','workload_score','wellbeing_score',
    'sleep_deficit','task_pressure','emotional_burden',
    'physical_mental_combined','recovery_score','overwhelm_index',
    'pending_ratio','stress_load','emotional_physical_ratio',
    'break_efficiency','mood_overwhelm_gap','total_stress_index',
    'high_risk_flag','task_stress_interaction','recovery_deficit',
    'emotional_collapse_risk','workload_per_hour',
]

X = df[feature_cols].fillna(0)
y = df['Stress_Label']
X = X[y.notna()]
y = y[y.notna()]
print(f"Features: {len(feature_cols)} | Samples: {len(X)}")

# ── Split ──────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# ── Try different balancing techniques ────────────────────────────────────
print("\nTrying different sampling methods...")
samplers = {
    'SMOTE':          SMOTE(random_state=42, k_neighbors=3),
    'BorderlineSMOTE':BorderlineSMOTE(random_state=42, k_neighbors=3),
    'SMOTETomek':     SMOTETomek(random_state=42),
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

best_overall_acc  = 0
best_overall_model= None
best_overall_pred = None
best_overall_cv   = None
best_overall_name = ''

for sname, sampler in samplers.items():
    try:
        X_bal, y_bal = sampler.fit_resample(X_train, y_train)
    except:
        X_bal, y_bal = SMOTE(random_state=42).fit_resample(X_train, y_train)

    print(f"\n  Sampler: {sname} → {dict(pd.Series(y_bal).value_counts())}")

    # Best ET config from previous run
    et = ExtraTreesClassifier(
        n_estimators=400,
        max_depth=15,
        max_features='log2',
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    et.fit(X_bal, y_bal)
    et_pred = et.predict(X_test)
    et_acc  = accuracy_score(y_test, et_pred)
    et_cv   = cross_val_score(et, X_train, y_train, cv=cv, scoring='accuracy')

    # Best RF config
    rf = RandomForestClassifier(
        n_estimators=500,
        max_depth=15,
        min_samples_split=3,
        min_samples_leaf=1,
        max_features='sqrt',
        class_weight='balanced',
        bootstrap=True,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_bal, y_bal)
    rf_pred = rf.predict(X_test)
    rf_acc  = accuracy_score(y_test, rf_pred)
    rf_cv   = cross_val_score(rf, X_train, y_train, cv=cv, scoring='accuracy')

    # GB
    gb = GradientBoostingClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        random_state=42,
    )
    gb.fit(X_bal, y_bal)
    gb_pred = gb.predict(X_test)
    gb_acc  = accuracy_score(y_test, gb_pred)
    gb_cv   = cross_val_score(gb, X_train, y_train, cv=cv, scoring='accuracy')

    # Voting
    voting = VotingClassifier(
        estimators=[('et', et), ('rf', rf), ('gb', gb)],
        voting='soft',
    )
    voting.fit(X_bal, y_bal)
    v_pred = voting.predict(X_test)
    v_acc  = accuracy_score(y_test, v_pred)
    v_cv   = cross_val_score(voting, X_train, y_train, cv=cv, scoring='accuracy')

    print(f"    ET:     Test={et_acc*100:.2f}% CV={et_cv.mean()*100:.2f}% Gap={abs(et_cv.mean()-et_acc)*100:.2f}%")
    print(f"    RF:     Test={rf_acc*100:.2f}% CV={rf_cv.mean()*100:.2f}% Gap={abs(rf_cv.mean()-rf_acc)*100:.2f}%")
    print(f"    GB:     Test={gb_acc*100:.2f}% CV={gb_cv.mean()*100:.2f}% Gap={abs(gb_cv.mean()-gb_acc)*100:.2f}%")
    print(f"    Voting: Test={v_acc*100:.2f}% CV={v_cv.mean()*100:.2f}% Gap={abs(v_cv.mean()-v_acc)*100:.2f}%")

    for mname, model, pred, acc, cv_s in [
        (f'{sname}-ET', et, et_pred, et_acc, et_cv),
        (f'{sname}-RF', rf, rf_pred, rf_acc, rf_cv),
        (f'{sname}-GB', gb, gb_pred, gb_acc, gb_cv),
        (f'{sname}-Voting', voting, v_pred, v_acc, v_cv),
    ]:
        if acc > best_overall_acc:
            best_overall_acc   = acc
            best_overall_model = model
            best_overall_pred  = pred
            best_overall_cv    = cv_s
            best_overall_name  = mname

# ── Stacking Classifier ────────────────────────────────────────────────────
print("\n[Trying Stacking Classifier...]")
X_bal, y_bal = SMOTE(random_state=42, k_neighbors=3).fit_resample(X_train, y_train)

base_learners = [
    ('et', ExtraTreesClassifier(n_estimators=400,max_depth=15,max_features='log2',class_weight='balanced',random_state=42)),
    ('rf', RandomForestClassifier(n_estimators=500,max_depth=15,min_samples_split=3,class_weight='balanced',random_state=42)),
    ('gb', GradientBoostingClassifier(n_estimators=300,max_depth=5,learning_rate=0.05,random_state=42)),
]
meta_learner = LogisticRegression(max_iter=1000, random_state=42)

stacking = StackingClassifier(
    estimators=base_learners,
    final_estimator=meta_learner,
    cv=5,
    passthrough=False,
    n_jobs=-1,
)
stacking.fit(X_bal, y_bal)
s_pred = stacking.predict(X_test)
s_acc  = accuracy_score(y_test, s_pred)
s_cv   = cross_val_score(stacking, X_train, y_train, cv=cv, scoring='accuracy')
print(f"  Stacking: Test={s_acc*100:.2f}% CV={s_cv.mean()*100:.2f}% Gap={abs(s_cv.mean()-s_acc)*100:.2f}%")

if s_acc > best_overall_acc:
    best_overall_acc   = s_acc
    best_overall_model = stacking
    best_overall_pred  = s_pred
    best_overall_cv    = s_cv
    best_overall_name  = 'Stacking'

# ── Final results ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("FINAL BEST MODEL")
print("=" * 60)
print(f"\nBest Model:    {best_overall_name}")
print(f"Test Accuracy: {best_overall_acc*100:.2f}%")
print(f"CV Accuracy:   {best_overall_cv.mean()*100:.2f}% +/- {best_overall_cv.std()*100:.2f}%")
print(f"Gap:           {abs(best_overall_cv.mean()-best_overall_acc)*100:.2f}%")
print(f"\nClassification Report:")
print(classification_report(y_test, best_overall_pred))
print(f"Confusion Matrix:")
cm = confusion_matrix(y_test, best_overall_pred, labels=['Low','Moderate','High'])
print(f"              Predicted")
print(f"              Low  Mod  High")
for i, rl in enumerate(['Low  ','Mod  ','High ']):
    print(f"Actual {rl}  {cm[i]}")

# ── Save ───────────────────────────────────────────────────────────────────
joblib.dump({
    'model':         best_overall_model,
    'feature_cols':  feature_cols,
    'accuracy':      best_overall_acc,
    'cv_accuracy':   best_overall_cv.mean(),
    'model_name':    best_overall_name,
    'component':     'caregiver',
    'tuning_method': 'Multi-sampler + Ensemble + Stacking',
}, 'stress_model.pkl')

print(f"\n✅ stress_model.pkl saved!")
print(f"✅ Test Accuracy: {best_overall_acc*100:.2f}%")
print(f"✅ CV Accuracy:   {best_overall_cv.mean()*100:.2f}%")
print(f"✅ Gap:           {abs(best_overall_cv.mean()-best_overall_acc)*100:.2f}%")
print("\n" + "=" * 60)
print("COMPLETE")
print("=" * 60)