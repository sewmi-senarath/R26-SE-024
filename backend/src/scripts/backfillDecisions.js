// ─────────────────────────────────────────────────────────────────────────
//  One-time backfill: computes `decision` for existing completed
//  SessionOutcome docs that pre-date the close-the-loop feature (so the
//  dashboard/Loop Health panel aren't empty on first use). Old sessions
//  with no matching StoryQuizAttempt get recallScore: null (honestly lands
//  on not_enough_data, same as any new session would without a quiz).
//  Old sessions whose follow-up window has already passed are marked
//  no_followup rather than left dangling as 'pending' forever.
//
//  Run manually only — not wired into index.js, not run automatically:
//    node src/scripts/backfillDecisions.js
// ─────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');

const SessionOutcome = require('../models/family/SessionOutcome');
const StoryQuizAttempt = require('../models/family/StoryQuizAttempt');
const FamilyMemory = require('../models/family/FamilyMemory');
const { computeDecision, CONFIG } = require('../services/family/decisionEngine');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected. Backfilling decisions for existing sessions...');

  const outcomes = await SessionOutcome.find({
    $or: [{ 'decision.code': { $exists: false } }, { 'decision.code': null }],
  }).sort({ createdAt: 1 });

  console.log(`Found ${outcomes.length} session(s) with no decision yet.`);

  let updated = 0;
  for (const outcome of outcomes) {
    const memory = await FamilyMemory.findById(outcome.memoryId).select('category');
    const attempt = await StoryQuizAttempt.findOne({ sessionId: outcome.sessionId, status: 'completed' });
    const recallScore = attempt ? attempt.score / attempt.questions.length : null;

    outcome.decision = computeDecision({
      moodLift: outcome.moodLift,
      framesUsed: outcome.totalReadings,
      recallScore,
      quizDetail: attempt
        ? { questions: attempt.questions.map((q) => ({ questionText: q.questionText, isCorrect: q.isCorrect, sourceSnippet: q.sourceSnippet })) }
        : null,
      reaction: null,
      category: memory ? memory.category : null,
    });

    // an old session that was never acted on has no real follow-up
    // tracking to backfill — leave followUp.status untouched (null) unless
    // it's already somehow pending and stale, in which case expire it
    const windowStart = new Date(Date.now() - CONFIG.FOLLOWUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (outcome.followUp?.status === 'pending' && outcome.createdAt < windowStart) {
      outcome.followUp.status = 'no_followup';
    }

    await outcome.save();
    updated += 1;
  }

  console.log(`Backfilled ${updated} session(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
