// Check (stage 6) — compares a newly-meaningful session (one whose quiz
// just completed, giving it real recall data) against the patient's
// earlier acted-on, still-pending sessions. Role-agnostic: called from
// both family and patient storyQuizController.js, since either role's
// screen can be the one that completes a quiz.
const SessionOutcome = require('../../models/family/SessionOutcome');
const { evaluateFollowUp, CONFIG } = require('./decisionEngine');

// runs every time a session's decision is recomputed with real recall —
// safe to run twice (only touches status: 'pending' records, and flips
// them to 'evaluated', so a second run finds nothing left to do)
const runFollowUpScan = async (newOutcome) => {
  if (!newOutcome.decision || newOutcome.decision.code === 'not_enough_data') return;

  const windowStart = new Date(Date.now() - CONFIG.FOLLOWUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await SessionOutcome.find({
    patientId: newOutcome.patientId,
    _id: { $ne: newOutcome._id },
    'followUp.status': 'pending',
    firstActedAt: { $ne: null },
    createdAt: { $gte: windowStart, $lt: newOutcome.createdAt }, // only a LATER session can follow up on an earlier one
  }).sort({ createdAt: 1 });

  for (const old of candidates) {
    const result = evaluateFollowUp({
      oldMoodLift: old.moodLift,
      oldRecallScore: old.decision?.inputs?.recallScore ?? null,
      newMoodLift: newOutcome.moodLift,
      newRecallScore: newOutcome.decision?.inputs?.recallScore ?? null,
      newCode: newOutcome.decision.code,
    });
    if (result === null) continue; // defensive — already guarded above, but evaluateFollowUp is the single source of truth for this rule

    old.followUp = {
      status: 'evaluated',
      nextSessionId: newOutcome.sessionId,
      outcome: result.outcome,
      moodDelta: result.moodDelta,
      recallDelta: result.recallDelta,
      evaluatedAt: new Date(),
    };
    await old.save();
  }
};

// lazy, on-read — no cron library exists in this backend (confirmed
// elsewhere in this codebase), same pattern as calendar's markMissedEvents.
// Call this once at the top of any read path that shows follow-up status
// (e.g. getPatientOutcomes, the Loop Health stats endpoint).
const expirePendingFollowUps = async (patientId) => {
  const windowStart = new Date(Date.now() - CONFIG.FOLLOWUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  await SessionOutcome.updateMany(
    { patientId, 'followUp.status': 'pending', createdAt: { $lt: windowStart } },
    { $set: { 'followUp.status': 'no_followup' } }
  );
};

module.exports = { runFollowUpScan, expirePendingFollowUps };
