require('../setup/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../helpers/testApp');
const { connectTestDB, closeTestDB, clearTestDB } = require('../../caregiver/helpers/testDb');
const { createLinkedFamily } = require('../helpers/factories');
const SessionOutcome = require('../../../src/models/family/SessionOutcome');
const FamilyMemory = require('../../../src/models/family/FamilyMemory');

const auth = (t) => ({ Authorization: `Bearer ${t}` });

test.before(connectTestDB);
test.after(closeTestDB);
test.afterEach(clearTestDB);

// a real-shaped SessionOutcome with a decision already computed, backing
// a real FamilyMemory — mirrors what finalizeSession actually produces
const seedOutcome = async (patient, { computedAt = new Date(), category = 'other' } = {}) => {
  const memory = await FamilyMemory.create({
    patientId: patient._id,
    uploadedBy: patient.caregiverId,
    photoUrl: 'https://example.com/photo.jpg',
    familyNote: 'a test memory',
    generatedStory: 'a test story',
    category,
  });
  const outcome = await SessionOutcome.create({
    patientId: patient._id,
    memoryId: memory._id,
    sessionId: `test-session-${Date.now()}-${Math.random()}`,
    moodLift: 0.8,
    totalReadings: 4,
    decision: {
      code: 'strong_happy',
      title: 'Strong, happy memory',
      text: 'test',
      confidence: 'medium',
      talkAboutTip: 'test tip',
      quality: { framesUsed: 4, framesTotal: null },
      inputs: { moodLift: 0.8, framesUsed: 4, framesTotal: null, recallScore: 1, reaction: null, category },
      suggestedActions: ['send_similar_story', 'share_with_family'],
      computedAt,
    },
  });
  return { memory, outcome };
};

test('rejects an unknown action type (400)', async () => {
  const { patient, token } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'not_a_real_action' });

  assert.equal(res.status, 400);
});

test('rejects a request with no auth token (401)', async () => {
  const { patient } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .send({ type: 'dismiss' });

  assert.equal(res.status, 401);
});

test('rejects a family member not linked to this patient (403)', async () => {
  const { patient } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);
  const { token: otherToken } = await createLinkedFamily(); // a different patient entirely

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(otherToken))
    .send({ type: 'dismiss' });

  assert.equal(res.status, 403);
});

test('logs a real action, sets firstActedAt, computes responseSeconds from decision.computedAt', async () => {
  const { patient, token } = await createLinkedFamily();
  const computedAt = new Date(Date.now() - 30000); // decision was computed 30s ago
  const { outcome } = await seedOutcome(patient, { computedAt });

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'share_with_family' });

  assert.equal(res.status, 200);
  assert.equal(res.body.outcome.actions.length, 1);
  assert.equal(res.body.outcome.actions[0].type, 'share_with_family');
  assert.ok(res.body.outcome.firstActedAt);
  assert.ok(res.body.outcome.sharedAt); // share_with_family's effect
  // responseSeconds should be roughly 30 (computed 30s after decision.computedAt)
  assert.ok(res.body.outcome.actions[0].responseSeconds >= 28 && res.body.outcome.actions[0].responseSeconds <= 32);
});

test('repeated taps of the same action within the dedup window do not create duplicates', async () => {
  const { patient, token } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);

  const first = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'call_now' });
  const second = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'call_now' });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.deduped, true);
  assert.equal(second.body.outcome.actions.filter((a) => a.type === 'call_now').length, 1);
});

test('call_now acknowledges the outcome without claiming a call was placed', async () => {
  const { patient, token } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'call_now' });

  assert.equal(res.body.outcome.acknowledged, true);
  assert.ok(res.body.outcome.actedAt);
});

test('dismiss acknowledges the outcome', async () => {
  const { patient, token } = await createLinkedFamily();
  const { outcome } = await seedOutcome(patient);

  const res = await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'dismiss' });

  assert.equal(res.body.outcome.acknowledged, true);
});

test('pause_topic excludes that category from getCategoryRecommendation, even with enough sessions', async () => {
  const { patient, token } = await createLinkedFamily();
  const { memory, outcome } = await seedOutcome(patient, { category: 'travel' });
  // a second real session in the same category, so it would normally qualify (MIN_SESSIONS_PER_CATEGORY = 2)
  await SessionOutcome.create({
    patientId: patient._id,
    memoryId: memory._id,
    sessionId: `test-session-${Date.now()}-${Math.random()}`,
    moodLift: 0.9,
    moodShiftPercent: 20,
    totalReadings: 4,
  });

  await request(app)
    .post(`/api/family/emotion/outcomes/${outcome._id}/actions`)
    .set(auth(token))
    .send({ type: 'pause_topic' });

  const rec = await request(app)
    .get(`/api/family/memories/recommendation/${patient._id}`)
    .set(auth(token));

  assert.equal(rec.status, 200);
  assert.equal(rec.body.ranked.some((r) => r.category === 'travel'), false);
});
