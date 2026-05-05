import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from imblearn.over_sampling import SMOTE

print("=" * 50)
print("CAREGIVER STRESS PREDICTION - TRAINING V3")
print("=" * 50)

# Load dataset
df = pd.read_excel('Caregiver_Stress_Dataset.xlsx')
print(f"Loaded: {df.shape[0]} rows")

# Encode categorical columns
df['age_encoded'] = df['Age Group'].map(
    {'18-25': 0, '18–25': 0, '26-35': 1, '26–35': 1,
     '36-50': 2, '36–50': 2, '50+': 3}
).fillna(1)

df['type_encoded'] = df['Caregiver Type'].map(
    {'Professional caregiver': 0, 'Nursing staff': 1}
).fillna(0)

df['exp_encoded'] = df['How many years of caregiving experience do you have?'].map(
    {'Less than 1 year': 0, '1-3 years': 1, '1–3 years': 1,
     '3-5 years': 2, '3–5 years': 2,
     '5-10 years': 3, '5–10 years': 3,
     'More than 10 years': 4}
).fillna(1)

df['sup_encoded'] = df['Do you have support from others?'].map(
    {'Yes': 1, 'No': 0}
).fillna(1)

# Convert numeric columns
num_cols = [
    'How many patients do you currently care for?',
    'How many hours did you sleep last night?',
    'How physically tired do you feel today? (1=Not tired, 5=Extremely tired)',
    'How many hours did you spend caregiving today?',
    'How many caregiving tasks were assigned today?',
    'How many tasks did you complete today?',
    'How many tasks are still pending?',
    'How many difficult situations occurred today? (e.g., patient confusion, agitation)',
    'How would you describe your mood today? (1=Very bad, 5=Very good)',
    'Did you feel emotionally overwhelmed today? (1=Not at all, 5=Extremely)',
    'I felt mentally exhausted today (1=Strongly Disagree, 5=Strongly Agree)',
    'I had difficulty managing my caregiving tasks today (1=Strongly Disagree, 5=Strongly Agree)',
    'I felt emotionally drained today (1=Strongly Disagree, 5=Strongly Agree)',
    'How many breaks did you take today?',
]
for col in num_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# Feature engineering
df['task_completion_rate'] = (
    df['How many tasks did you complete today?'] /
    df['How many caregiving tasks were assigned today?'].replace(0, 1)
).fillna(0.8)

df['workload_score'] = (
    df['How many tasks are still pending?'] +
    df['How many difficult situations occurred today? (e.g., patient confusion, agitation)']
)

df['wellbeing_score'] = (
    df['Did you feel emotionally overwhelmed today? (1=Not at all, 5=Extremely)'] +
    df['I felt mentally exhausted today (1=Strongly Disagree, 5=Strongly Agree)'] +
    df['I felt emotionally drained today (1=Strongly Disagree, 5=Strongly Agree)']
)

df['sleep_deficit'] = 8 - df['How many hours did you sleep last night?']

df['task_pressure'] = (
    df['How many caregiving tasks were assigned today?'] /
    df['How many hours did you spend caregiving today?'].replace(0, 1)
)

df['emotional_burden'] = (
    df['Did you feel emotionally overwhelmed today? (1=Not at all, 5=Extremely)'] +
    df['I had difficulty managing my caregiving tasks today (1=Strongly Disagree, 5=Strongly Agree)']
)

df['physical_mental_combined'] = (
    df['How physically tired do you feel today? (1=Not tired, 5=Extremely tired)'] +
    df['I felt mentally exhausted today (1=Strongly Disagree, 5=Strongly Agree)']
)

# Features - stress_score_raw is NOT included (data leakage)
feature_cols = [
    'age_encoded',
    'type_encoded',
    'exp_encoded',
    'sup_encoded',
    'How many patients do you currently care for?',
    'How many hours did you sleep last night?',
    'How physically tired do you feel today? (1=Not tired, 5=Extremely tired)',
    'How many hours did you spend caregiving today?',
    'How many caregiving tasks were assigned today?',
    'How many tasks did you complete today?',
    'How many tasks are still pending?',
    'How many difficult situations occurred today? (e.g., patient confusion, agitation)',
    'How would you describe your mood today? (1=Very bad, 5=Very good)',
    'Did you feel emotionally overwhelmed today? (1=Not at all, 5=Extremely)',
    'I felt mentally exhausted today (1=Strongly Disagree, 5=Strongly Agree)',
    'I had difficulty managing my caregiving tasks today (1=Strongly Disagree, 5=Strongly Agree)',
    'I felt emotionally drained today (1=Strongly Disagree, 5=Strongly Agree)',
    'How many breaks did you take today?',
    'task_completion_rate',
    'workload_score',
    'wellbeing_score',
    'sleep_deficit',
    'task_pressure',
    'emotional_burden',
    'physical_mental_combined',
]

# Verify stress_score_raw is NOT in features
assert 'stress_score_raw' not in feature_cols, "DATA LEAKAGE DETECTED!"
print("\n✅ No data leakage detected")

X = df[feature_cols].fillna(0)
y = df['Stress Level (Label)']

mask = y.notna()
X    = X[mask]
y    = y[mask]

print(f"\nTarget distribution:")
print(y.value_counts())

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# SMOTE on training data only
print(f"\nApplying SMOTE to balance training data...")
smote = SMOTE(random_state=42, k_neighbors=3)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

print(f"After SMOTE:")
print(pd.Series(y_train_bal).value_counts())

# Train models
print("\nTraining models...")

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features='sqrt',
    random_state=42,
)

gb = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    random_state=42,
)

rf.fit(X_train_bal, y_train_bal)
gb.fit(X_train_bal, y_train_bal)

rf_pred = rf.predict(X_test)
gb_pred = gb.predict(X_test)
rf_acc  = accuracy_score(y_test, rf_pred)
gb_acc  = accuracy_score(y_test, gb_pred)

voting = VotingClassifier(
    estimators=[('rf', rf), ('gb', gb)],
    voting='soft',
)
voting.fit(X_train_bal, y_train_bal)
voting_pred = voting.predict(X_test)
voting_acc  = accuracy_score(y_test, voting_pred)

print(f"\nRandom Forest:     {rf_acc*100:.1f}%")
print(f"Gradient Boosting: {gb_acc*100:.1f}%")
print(f"Voting Classifier: {voting_acc*100:.1f}%")

# Pick best
results = {
    'Random Forest':     (rf,     rf_acc,     rf_pred),
    'Gradient Boosting': (gb,     gb_acc,     gb_pred),
    'Voting Classifier': (voting, voting_acc, voting_pred),
}
best_name = max(results, key=lambda k: results[k][1])
best_model, best_acc, best_pred = results[best_name]

print(f"\n{'='*50}")
print(f"BEST MODEL : {best_name}")
print(f"ACCURACY   : {best_acc*100:.1f}%")
print(f"{'='*50}")
print(classification_report(y_test, best_pred))

cv_scores = cross_val_score(
    best_model, X_train_bal, y_train_bal,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
)
print(f"CV Accuracy: {cv_scores.mean()*100:.1f}% +/- {cv_scores.std()*100:.1f}%")

# Feature importance
base = rf if best_name == 'Voting Classifier' else best_model
if hasattr(base, 'feature_importances_'):
    print("\nTop 10 Important Features:")
    imp = pd.Series(
        base.feature_importances_, index=feature_cols
    ).nlargest(10)
    for feat, val in imp.items():
        bar = '█' * int(val * 60)
        print(f"  {bar} {val:.4f} — {feat}")

# Save
joblib.dump({
    'model':        best_model,
    'feature_cols': feature_cols,
    'accuracy':     best_acc,
    'model_name':   best_name,
    'component':    'caregiver',
}, 'stress_model.pkl')

print(f"\n✅ stress_model.pkl saved!")
print(f"✅ Real Accuracy (no leakage): {best_acc*100:.1f}%")