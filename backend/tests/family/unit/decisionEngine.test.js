const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDecision, evaluateFollowUp, CONFIG } = require('../../../src/services/family/decisionEngine');

// ── computeDecision — one case per decision code ────────────────────────

test('strong_happy: good mood + good recall', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 1 });
  assert.equal(d.code, 'strong_happy');
  assert.deepEqual(d.suggestedActions, ['send_similar_story', 'share_with_family']);
});

test('comforting_fading: good mood + weak recall', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 0.33 });
  assert.equal(d.code, 'comforting_fading');
  assert.deepEqual(d.suggestedActions, ['call_or_visit', 'show_photo_together']);
});

test('clear_painful: poor mood + good recall', () => {
  const d = computeDecision({ moodLift: -0.2, framesUsed: 4, recallScore: 1 });
  assert.equal(d.code, 'clear_painful');
  assert.deepEqual(d.suggestedActions, ['pause_topic', 'try_gentler_story']);
});

test('confusing_upsetting: poor mood + weak recall', () => {
  const d = computeDecision({ moodLift: -0.5, framesUsed: 4, recallScore: 0 });
  assert.equal(d.code, 'confusing_upsetting');
  assert.deepEqual(d.suggestedActions, ['call_now', 'pause_topic']);
});

test('not_enough_data: too few good frames', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 1, recallScore: 1 });
  assert.equal(d.code, 'not_enough_data');
  assert.deepEqual(d.suggestedActions, ['call_or_visit', 'dismiss']);
});

test('not_enough_data: no quiz at all (recallScore null — the common case right after finalizeSession)', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: null });
  assert.equal(d.code, 'not_enough_data');
});

test('boundary: moodLift exactly at MOOD_GOOD_MIN counts as good', () => {
  const d = computeDecision({ moodLift: CONFIG.MOOD_GOOD_MIN, framesUsed: 4, recallScore: 1 });
  assert.equal(d.code, 'strong_happy');
});

test('boundary: recallScore exactly at RECALL_GOOD_MIN counts as good', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: CONFIG.RECALL_GOOD_MIN });
  assert.equal(d.code, 'strong_happy');
});

// ── confidence rules ─────────────────────────────────────────────────────

test('confidence: high when mood, recall and reaction all agree (positive)', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 1, reaction: 'happy' });
  assert.equal(d.confidence, 'high');
});

test('confidence: high when mood, recall and reaction all agree (negative)', () => {
  const d = computeDecision({ moodLift: -0.5, framesUsed: 4, recallScore: 0, reaction: 'sad' });
  assert.equal(d.confidence, 'high');
});

test('confidence: medium when reaction is missing', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 1, reaction: null });
  assert.equal(d.confidence, 'medium');
});

test('confidence: low when patient reaction disagrees with the face signal, and text says so', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 1, reaction: 'sad' });
  assert.equal(d.confidence, 'low');
  assert.match(d.text, /reaction suggested something different/);
});

test('confidence: medium when mood+reaction agree but recall is the outlier', () => {
  // moodLift good (positive), recall weak (negative), reaction happy (positive) -> mood & reaction agree, recall differs
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: 0, reaction: 'happy' });
  assert.equal(d.confidence, 'medium');
});

// ── talk-about tip ────────────────────────────────────────────────────────

test('talkAboutTip: uses a missed quiz question with its source snippet when available', () => {
  const d = computeDecision({
    moodLift: 0.8, framesUsed: 4, recallScore: 0.33,
    quizDetail: {
      questions: [
        { questionText: 'Do you remember where this happened?', isCorrect: true, sourceSnippet: 'at the beach' },
        { questionText: 'Do you remember when this happened?', isCorrect: false, sourceSnippet: 'last summer' },
      ],
    },
  });
  assert.match(d.talkAboutTip, /did not remember when this happened/);
  assert.match(d.talkAboutTip, /last summer/);
});

test('talkAboutTip: falls back to a safe generic tip when there is no quiz detail', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, recallScore: null });
  assert.equal(typeof d.talkAboutTip, 'string');
  assert.ok(d.talkAboutTip.length > 0);
});

// ── quality / inputs passthrough ────────────────────────────────────────

test('quality and inputs are recorded for audit', () => {
  const d = computeDecision({ moodLift: 0.8, framesUsed: 4, framesTotal: 6, recallScore: 1, category: 'wedding' });
  assert.deepEqual(d.quality, { framesUsed: 4, framesTotal: 6 });
  assert.equal(d.inputs.moodLift, 0.8);
  assert.equal(d.inputs.category, 'wedding');
});

// ── evaluateFollowUp ──────────────────────────────────────────────────────

test('followUp: better when mood improved by at least FOLLOWUP_MOOD_DELTA', () => {
  const r = evaluateFollowUp({ oldMoodLift: -0.5, oldRecallScore: 0.5, newMoodLift: 0, newRecallScore: 0.5, newCode: 'strong_happy' });
  assert.equal(r.outcome, 'better');
});

test('followUp: better when recall improved and mood did not get worse (even if mood barely moved)', () => {
  const r = evaluateFollowUp({ oldMoodLift: 0, oldRecallScore: 0.33, newMoodLift: 0.1, newRecallScore: 1, newCode: 'strong_happy' });
  assert.equal(r.outcome, 'better');
});

test('followUp: worse when mood dropped by at least FOLLOWUP_MOOD_DELTA', () => {
  const r = evaluateFollowUp({ oldMoodLift: 0.8, oldRecallScore: 1, newMoodLift: 0.2, newRecallScore: 1, newCode: 'comforting_fading' });
  assert.equal(r.outcome, 'worse');
});

test('followUp: same when nothing meaningfully changed', () => {
  const r = evaluateFollowUp({ oldMoodLift: 0.6, oldRecallScore: 1, newMoodLift: 0.65, newRecallScore: 1, newCode: 'strong_happy' });
  assert.equal(r.outcome, 'same');
});

test('followUp: not_enough_data new session is left unevaluated (null)', () => {
  const r = evaluateFollowUp({ oldMoodLift: 0.6, oldRecallScore: 1, newMoodLift: 0.1, newRecallScore: null, newCode: 'not_enough_data' });
  assert.equal(r, null);
});

test('followUp: recallDelta is null when either session has no recall score', () => {
  const r = evaluateFollowUp({ oldMoodLift: 0.6, oldRecallScore: null, newMoodLift: 0.9, newRecallScore: 1, newCode: 'strong_happy' });
  assert.equal(r.recallDelta, null);
  assert.equal(r.outcome, 'better'); // still better purely from the mood delta
});
