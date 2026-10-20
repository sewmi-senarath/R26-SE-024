# Memory-score forecast (4 / 8 weeks) and decline risk

`train_forecast.py` trains and evaluates the models the memory progress report uses
(`memory-service/memory_forecast.py`). Results: `results.json`.

    python train_forecast.py      # writes memory-service/forecast_model/{memory_forecast.joblib, prior.json}

## Why a model, not the old rule
The report used to estimate "in 4 weeks" as *average of the last 7 days + 4 x weekly slope*.
With few, noisy game days that slope swings a lot (one bad day can mean "-8 per week").

## Models
1. **Partial pooling (mixed-effects random slope, empirical Bayes)**
   `slope = w * own slope + (1 - w) * population slope`, with `w = tau^2 / (tau^2 + se^2)`.
   Few or noisy days -> small `w` -> pulled to the population trend; many consistent days ->
   the patient's own trend. Gives a 95% range that widens with the horizon.
2. **Gradient boosting** (scikit-learn) for *P(drop of >= 5 points in 4 weeks)* from the
   pooled trend, own trend and its error, noise, adherence, MMSE and cognitive-game trends.

## Data
* **Simulated cohort**, 300 patients x 120 days (clearly simulated, documented generative
  model in the script: stable / slow / fast decliners, day-to-day noise, missed days, bad days,
  MMSE every ~30 days, cognitive games). Real patients have days to weeks of data - too
  little to train on - so the models are trained only on this cohort.
* **Real MMSE** (team MongoDB, read-only) - only an external check, never training data.

## Results (unseen simulated patients, 270 forecasts from 90 patients)

| | old rule (avg7 + slope) | partial pooling | gradient boosting |
|---|---|---|---|
| MAE, 4 weeks (points /100) | 7.90 | **4.42** | |
| MAE, 8 weeks | 12.22 | **6.52** | |
| AUROC, decline >= 5 in 4 weeks | 0.860 (raw slope) | 0.963 (pooled slope) | **0.971** |
| Brier score | | | 0.065 |

Real MMSE, leave-last-out (4 patients with 3+ tests, indicative only): MAE last value 12.5,
linear trend 14.1, partial pooling 11.5 MMSE points. (The team's MMSE test records swing a lot,
e.g. 0 -> 27, because they include test runs.)

## Limits (say these in the viva)
* Trained on a simulated cohort; the simulator encodes our assumptions, so real-world
  accuracy must be measured on real longitudinal data (next step: user study with weekly MMSE).
* No forecast with fewer than 5 game days in the last 30 (or less than a week of span):
  the app shows "not enough data" instead of a number.
* Monitoring support only - not a diagnosis.
