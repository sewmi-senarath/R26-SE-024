require('../setup/env');
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, closeTestDB, clearTestDB } = require('../../caregiver/helpers/testDb');
const { createLinkedFamily } = require('../helpers/factories');
const SessionOutcome = require('../../../src/models/family/SessionOutcome');
const { runFollowUpScan, expirePendingFollowUps } = require('../../../src/services/family/followUpScanner');

test.before(connectTestDB);
test.after(closeTestDB);
test.afterEach(clearTestDB);

const decision = (code, recallScore, overrides = {}) => ({
  code,
  title: 'test', text: 'test', confidence: 'medium', talkAboutTip: 'test',
  quality: { framesUsed: 4, framesTotal: null },
  inputs: { moodLift: 0, framesUsed: 4, framesTotal: null, recallScore, reaction: null, category: 'other' },
  suggestedActions: [],
  computedAt: new Date(),
  ...overrides,
});

// a "pending" earlier session — acted on, eligible for follow-up
const seedPendingOld = async (patient, { moodLift, recallScore, createdAt = new Date() }) => {
  return SessionOutcome.create({
    patientId: patient._id,
    memoryId: patient._id, // any valid ObjectId — memoryId isn't populated/required by these tests
    sessionId: `old-${Date.now()}-${Math.random()}`,
    moodLift,
    decision: decision('strong_happy', recallScore, { inputs: { moodLift, framesUsed: 4, framesTotal: null, recallScore, reaction: null, category: 'other' } }),
    firstActedAt: new Date(),
    followUp: { status: 'pending' },
    createdAt,
  });
};

const seedNew = async (patient, { moodLift, recallScore, code = 'strong_happy' }) => {
  return SessionOutcome.create({
    patientId: patient._id,
    memoryId: patient._id,
    sessionId: `new-${Date.now()}-${Math.random()}`,
    moodLift,
    decision: decision(code, recallScore, { inputs: { moodLift, framesUsed: 4, framesTotal: null, recallScore, reaction: null, category: 'other' } }),
  });
};

test('better: new session with meaningfully higher mood marks the old one evaluated/better', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: -0.5, recallScore: 0.5 });
  const fresh = await seedNew(patient, { moodLift: 0.5, recallScore: 0.5 }); // +1.0, well above FOLLOWUP_MOOD_DELTA

  await runFollowUpScan(fresh);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.status, 'evaluated');
  assert.equal(updated.followUp.outcome, 'better');
  assert.equal(updated.followUp.nextSessionId, fresh.sessionId);
});

test('worse: new session with meaningfully lower mood marks the old one evaluated/worse', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: 0.8, recallScore: 1 });
  const fresh = await seedNew(patient, { moodLift: 0.1, recallScore: 1 });

  await runFollowUpScan(fresh);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.outcome, 'worse');
});

test('same: no meaningful change marks the old one evaluated/same', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: 0.6, recallScore: 1 });
  const fresh = await seedNew(patient, { moodLift: 0.65, recallScore: 1 });

  await runFollowUpScan(fresh);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.outcome, 'same');
});

test('not_enough_data: a new session with no real signal leaves the old session untouched (still pending)', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: 0.6, recallScore: 1 });
  const fresh = await seedNew(patient, { moodLift: 0.1, recallScore: null, code: 'not_enough_data' });

  await runFollowUpScan(fresh);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.status, 'pending'); // left exactly as it was
});

test('idempotency: running the scan twice for the same new session does not change the result a second time', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: -0.5, recallScore: 0.5 });
  const fresh = await seedNew(patient, { moodLift: 0.5, recallScore: 0.5 });

  await runFollowUpScan(fresh);
  const firstPass = await SessionOutcome.findById(old._id);
  assert.equal(firstPass.followUp.status, 'evaluated');

  await runFollowUpScan(fresh); // run again — old session is no longer 'pending', so this is a no-op for it
  const secondPass = await SessionOutcome.findById(old._id);
  assert.equal(secondPass.followUp.status, 'evaluated');
  assert.equal(secondPass.followUp.outcome, firstPass.followUp.outcome);
  assert.equal(secondPass.followUp.evaluatedAt.getTime(), firstPass.followUp.evaluatedAt.getTime()); // not re-evaluated/re-timestamped
});

test('only a later session can be a follow-up to an earlier one', async () => {
  const { patient } = await createLinkedFamily();
  // "old" is actually created AFTER "fresh" in wall-clock terms — should not be matched
  const fresh = await seedNew(patient, { moodLift: 0.5, recallScore: 0.5 });
  const old = await seedPendingOld(patient, { moodLift: -0.5, recallScore: 0.5 });

  await runFollowUpScan(fresh);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.status, 'pending'); // untouched — "old" is not actually earlier than "fresh"
});

test('window expiry: a pending session older than the follow-up window becomes no_followup', async () => {
  const { patient } = await createLinkedFamily();
  const longAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago, window is 14
  const old = await seedPendingOld(patient, { moodLift: 0.6, recallScore: 1, createdAt: longAgo });
  await SessionOutcome.updateOne({ _id: old._id }, { createdAt: longAgo }); // createdAt is set by timestamps on create; force it

  await expirePendingFollowUps(patient._id);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.status, 'no_followup');
});

test('window expiry does not touch a recent pending session', async () => {
  const { patient } = await createLinkedFamily();
  const old = await seedPendingOld(patient, { moodLift: 0.6, recallScore: 1 });

  await expirePendingFollowUps(patient._id);

  const updated = await SessionOutcome.findById(old._id);
  assert.equal(updated.followUp.status, 'pending');
});
