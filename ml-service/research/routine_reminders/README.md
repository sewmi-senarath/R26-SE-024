# Sensor-free adaptive medication reminders: simulation study

**Result:** without any home sensors, reminders that learn each patient's routine from their own "done" taps, check how far those taps can be trusted, and adapt their style cut missed medicine doses from 16.2% (current rule-based reminder) and 13.1% (fixed alarm) to **4.0%** over 100 patients and 90 days (paired Wilcoxon p < 1e-17 against both).

## Question

Can a reminder system that uses only patient and caregiver responses (no sensors) reduce missed medicine doses for people with dementia compared with a fixed daily alarm and with the current routine-based reminder?

## Data

| Part | Source |
|---|---|
| Medicine-taking times | CASAS smart-home labeled data, Washington State University, [Zenodo record 15708568](https://zenodo.org/records/15708568), CC-BY-4.0. 10 homes of older adults living alone (hh101, hh103, hh105, hh106, hh110, hh114, hh118, hh119, hh122, hh126) with `Morning_Meds` / `Evening_Meds` / `Take_Medicine` labels, 12-56 labelled days per home. Extracted first times per day are in `casas_routines.json`. |
| Patients | The 15 elder-home profiles (memory, aggression, Parkinson's categories only; no names) plus 85 virtual patients resampled from them = 100. Severity: 44 severe, 15 moderate, 41 mild. |
| Behaviour | Stated assumptions in `simulate.py` (`ASSUMPTIONS`): chance of forgetting a dose by severity, false "done" taps, which reminder style works for each person. |

The CASAS residents are older adults, not people diagnosed with dementia: CASAS gives realistic medicine timings; the dementia behaviour comes from the profiles and the assumptions.

## Strategies

| Strategy | What it does |
|---|---|
| A Fixed alarm | One alarm at the prescribed time every day |
| B Routine (current system) | Learns the usual time from "done" taps; one reminder 30 min after it if no tap; trusts every tap |
| B + escalation | B plus a follow-up reminder and a caregiver alert, no AI parts |
| **C Adaptive + trust (ours)** | B + escalation + risk-based timing + Thompson sampling over 9 reminder styles (3 timings x text / AI voice / family voice) + a trust model for "done" taps (low trust: ask the caregiver to check) |
| C without trust model | Ablation |
| C without style learning | Ablation |

All strategies face the same random days (paired design).

## Results (100 patients x 90 days x 2 doses a day)

| Strategy | Missed doses | 95% CI | Reminders/day | Unneeded/day | Wrongly believed taken | Caregiver alerts/week |
|---|---|---|---|---|---|---|
| A Fixed alarm | 13.1% | 11.7-14.5 | 1.00 | 0.34 | 0.0% | 0 |
| B Routine (current) | 16.2% | 14.3-18.0 | 0.54 | 0.09 | 5.2% | 0 |
| B + escalation | 6.4% | 5.4-7.5 | 0.64 | 0.09 | 5.0% | 0.32 |
| **C Adaptive + trust** | **4.0%** | **3.3-4.6** | 0.68 | 0.10 | **2.8%** | **0.27** |
| C without trust model | 5.5% | 4.6-6.5 | 0.66 | 0.10 | 4.4% | 0.26 |
| C without style learning | 4.2% | 3.6-4.9 | 0.69 | 0.09 | 2.8% | 0.34 |

- **Escalation alone** (follow-up + caregiver alert) does most of the work: 16.2% to 6.4%.
- **The AI parts add a further 2.4 points** (6.4% to 4.0%, about 38% fewer misses; p = 1.1e-11; better for 65 patients, worse for 10).
- **The trust model is the largest AI contribution:** without it, 5.5% missed and 4.4% of doses wrongly believed taken.
- **Style learning barely changes misses** (4.2% to 4.0%) but cuts caregiver alerts by 21% (0.34 to 0.27 a week).
- **Severe memory loss gains most:** 18.9% (fixed alarm) and 11.7% (B + escalation) to 6.5%.
- The 15 real profiles (2.9%) and the 85 virtual ones (4.1%) give the same picture.
- **Robust to the assumptions:** with all behaviour parameters 30% worse, C misses 5.6% vs 21.6% (A) and 10.8% (B + escalation); 30% better, 2.0% vs 3.9% and 2.5%.

Figures: `results/fig_reminder_strategies.png`, `fig_reminder_bridge.png`, `fig_reminder_severity.png`, `fig_reminder_weekly.png`.

## Limitations

- Simulated patients: the behaviour model is assumed, not measured; the size of the gains depends on it (the sensitivity run bounds this).
- CASAS homes are older adults, not dementia patients.
- A short real test at the elder home (caregiver "given" confirmations and patient responses) is needed to confirm the effect.

## Reproduce

```
python simulate.py --casas <folder with CASAS hhNNN.csv files> --sensitivity   # first run
python simulate.py --sensitivity                                                # later runs
python charts.py
```
