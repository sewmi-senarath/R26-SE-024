# Family component services

## Close the Loop (Decide → Act → Log → Check)

Turns a finished story-listening session into a concrete, gentle suggestion
for the family, then tracks whether acting on it actually helped next time.

```
1 Send   -> family uploads a photo + note, story is generated (memoryController.js)
2 Sense  -> patient listens, emotion + a 3-question recall quiz are captured
3 Decide -> decisionEngine.js — rules, not AI, join mood + recall into a code
4 Act    -> family taps a suggested action on the Family Action Card
5 Log    -> the action, its time, and response time are saved
6 Check  -> the next session is compared against the acted-on one
```

### Where it runs
- **Decide** runs twice per session, both in `emotionController.js`/`storyQuizController.js`
  (family + patient, mirrored): once at `finalizeSession` (mood known, recall
  always null yet — the quiz hasn't even been requested from the frontend
  at that point), and again when that session's quiz reaches `completed`
  status. Real recall data almost never exists at the first computation, so
  most sessions start as `not_enough_data` and upgrade once the patient
  finishes the quiz (if they do).
- **Act / Log** is `POST /family/emotion/outcomes/:id/actions` — family only,
  no patient-side route exists (unlike emotion capture, nothing about
  logging an action is ever done from the patient's own screen).
- **Check** (`services/family/followUpScanner.js`) runs right after a
  session's decision is recomputed with real recall — compares it against
  the patient's earlier acted-on, still-`pending` sessions within the
  14-day window. Lazily expires stale pending sessions to `no_followup` on
  read (`expirePendingFollowUps`, same pattern as the calendar's
  `markMissedEvents` — no cron library in this backend).

### Thresholds (`decisionEngine.js`'s `CONFIG`), and why
- `MOOD_GOOD_MIN: 0.5` — reuses the existing `ALERT_THRESHOLD` from
  `finalizeSession` exactly, so "good mood" and "alert-worthy" mean the
  same real bar. On this app's `moodLift` scale, confirmed live that a real
  32-point swing in happy-confidence only produced `moodLift: -0.64` — the
  scale is small in practice, not ±4 in practice even though that's its
  theoretical range.
- `RECALL_GOOD_MIN: 0.6` — the quiz is always exactly 3 questions, so this
  means "2 of 3 correct or better."
- `MIN_FRAMES_USED: 2`, not a stricter number — both real sessions in the
  dev DB at the time this was built had exactly 2 `EmotionLog` readings. A
  higher minimum would make `not_enough_data` the permanent, universal
  result.
- `FOLLOWUP_WINDOW_DAYS: 14`, `FOLLOWUP_MOOD_DELTA: 0.3` (roughly 60% of
  `MOOD_GOOD_MIN` — "better" needs a real but smaller swing than "good"
  needs from a standing start).

### Data fields (`SessionOutcome`)
- `decision`: `{ code, title, text, confidence, talkAboutTip, quality, inputs, suggestedActions, computedAt }`
- `actions[]`: `{ type, takenAt, takenBy, responseSeconds }`
- `firstActedAt`, `sharedAt` (set by the `share_with_family` action)
- `followUp`: `{ status, nextSessionId, outcome, moodDelta, recallDelta, evaluatedAt }`

### `PatientTopicPreference` (new, family-scoped model)
Set by the `pause_topic` action — `{ patientId, category, status: 'sensitive', setBy, setAt }`.
Excluded from `getCategoryRecommendation`'s ranking (`memoryController.js`).

### Known gaps, on purpose
- **No phone number exists anywhere in the system** (checked both the
  shared `Patient` and `User` models) — `call_now`/`call_or_visit` always
  take the "no number" path. Not fixable without a teammate adding a phone
  field to one of those shared models.
- **No patient reaction (emoji/voice/video) is captured for story
  sessions** — `EventReaction` only exists for calendar events. `reaction`
  is always passed as `null` into `computeDecision` today; the confidence
  rules are already built to handle it correctly once it exists.
- `send_similar_story` / `try_gentler_story` log the action and navigate to
  the Stories tab — they don't deep-prefill the create-story form (that
  screen doesn't accept prefill params yet).

### Tests
`npm run test:family` — 22 decision-engine unit tests + 16 integration
tests (actions route: auth/dedup/unknown-type/response-time/effects;
follow-up: better/same/worse/not_enough_data/idempotency/window-expiry),
using `node:test` + `supertest` + an isolated in-memory MongoDB (never
touches the real database).
