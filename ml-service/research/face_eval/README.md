# Family face recognition - evaluation

`eval_faces.py` measures the family-greeting rule on the FaceNet embeddings of the
caregiver's enrolment photos (leave-one-out, one gallery per patient, as the app matches).

    python eval_faces.py ../../memory-service/moments_db.json --out results.json

Result on the data of 2026-10-20 (2 families, 5 enrolled people, 22 photos):

| rule | known faces correct | asked "who is this?" | wrong name | stranger named as family |
|---|---|---|---|---|
| old: nearest view >= 0.65 | 22 / 22 | 0 | 0 | 0 / 22 |
| new: >= 0.72, agrees with enrolment photos, margin >= 0.08 | 21 / 22 | 1 | 0 | 0 / 22 |

Same person: mean cosine 0.85 (min 0.62). Different people: mean 0.23 (max 0.52).

## What actually went wrong in the field

On enrolment photos both rules work. The failure ("Pasindu is greeted as Lashan") came
from the **adaptive learning step**: every match between 0.65 and 0.92 was added to that
person's gallery, so one borderline match of another face became a "view of Lashan", and
after that the other face matched Lashan strongly. Lashan's gallery had grown to 15 views
whose pairwise similarity went as low as 0.16 (two different faces).

Fix (remember_moments.py):
* enrolment photos are kept as **anchors** and never rotated out;
* a view is learned only at >= 0.80 and when it also agrees with the anchors (>= 0.60);
* greeting needs >= 0.72, anchor agreement and a **margin** of 0.08 over the next family
  member - otherwise the app asks "who is this?" (a wrong name is worse than a question);
* **quality gate**: face width (>= 60 px enrolment / 48 px live) and sharpness
  (Laplacian variance of the face crop) - blurred frames are skipped, not guessed;
* enrolment of a look-alike: the caregiver sees "looks like Lashan (78%) - different
  person?" and decides (PIN), instead of a hard "already registered";
* existing galleries are healed at start-up: anchored on the enrolment photo, views that
  disagree are removed. On the 2026-10-20 data Lashan's gallery went 15 -> 5 views, and the
  10 removed views no longer resolve to Lashan.
