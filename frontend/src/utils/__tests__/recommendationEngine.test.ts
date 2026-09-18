import { describe, it, expect } from '@jest/globals';

import {
  generateRecommendations,
  getSummaryMessage,
} from '../recommendationEngine';

import {
  DailyCheckIn,
  CheckInResult,
  BurnoutRisk,
} from '../../types/caregiver.types';

// A "nothing wrong" baseline check-in. Individual tests override just the
// field(s) they care about, so each test only has to think about one thing.
const baseForm = (overrides: Partial<DailyCheckIn> = {}): DailyCheckIn => ({
  sleepHours: 8,
  physicalTiredness: 1,
  mood: 5,
  emotionalOverwhelm: 1,
  hoursCaregiving: 4,
  tasksAssigned: 5,
  tasksCompleted: 5,
  difficultSituations: 0,
  breaksTaken: 3,
  mentallyExhausted: 1,
  difficultyManaging: 1,
  emotionallyDrained: 1,
  ...overrides,
});

const baseResult = (overrides: Partial<CheckInResult> = {}): CheckInResult => ({
  stressLevel: 'Moderate',
  stressScore: 5,
  confidence: 0.9,
  message: 'Test message',
  tips: [],
  submittedAt: new Date().toISOString(),
  ...overrides,
});

// Helper: find a recommendation by id, or undefined if the engine didn't produce it.
const findRec = (recs: ReturnType<typeof generateRecommendations>, id: string) =>
  recs.find((r) => r.id === id);

describe('generateRecommendations', () => {
  it('flags a severe sleep deficit as High priority when sleep is 4h or less', () => {
    const recs = generateRecommendations(baseForm({ sleepHours: 4 }), baseResult());
    const sleepRec = findRec(recs, 'sleep');

    expect(sleepRec).toBeDefined();
    expect(sleepRec?.priority).toBe('High');
    expect(sleepRec?.title).toBe('Severe Sleep Deficit Detected');
  });

  it('does NOT flag sleep when sleepHours is 6 or more', () => {
    const recs = generateRecommendations(baseForm({ sleepHours: 6 }), baseResult());
    expect(findRec(recs, 'sleep')).toBeUndefined();
  });

  it('flags zero breaks as a High priority "no-breaks" recommendation', () => {
    const recs = generateRecommendations(baseForm({ breaksTaken: 0 }), baseResult());
    const noBreaksRec = findRec(recs, 'no-breaks');

    expect(noBreaksRec).toBeDefined();
    expect(noBreaksRec?.priority).toBe('High');
  });

  it('respects the suppressed list and skips a rule even if its condition is met', () => {
    const recs = generateRecommendations(
      baseForm({ sleepHours: 4 }),
      baseResult(),
      ['sleep'], // suppressed
    );
    expect(findRec(recs, 'sleep')).toBeUndefined();
  });

  it('escalates Medium-priority recommendations to High when overall stress is High', () => {
    // breaksTaken=1 with hoursCaregiving=6 triggers "few-breaks", which is
    // normally Medium priority.
    const form = baseForm({ breaksTaken: 1, hoursCaregiving: 6 });

    const moderateResult = baseResult({ stressLevel: 'Moderate' });
    const highResult = baseResult({ stressLevel: 'High' });

    const recsModerate = generateRecommendations(form, moderateResult);
    const recsHigh = generateRecommendations(form, highResult);

    expect(findRec(recsModerate, 'few-breaks')?.priority).toBe('Medium');
    expect(findRec(recsHigh, 'few-breaks')?.priority).toBe('High');
  });

  it('adds the "trend-worsening" recommendation when weekly burnout data shows a worsening trend', () => {
    const weekly: BurnoutRisk = {
      riskScore: 40,
      riskLevel: 'Moderate',
      trend: 'worsening',
      forecast: 'test forecast',
      factors: [],
      daysAnalyzed: 5,
      avgStressScore: 6.2,
      consecutiveHigh: 0,
    };

    const recs = generateRecommendations(baseForm(), baseResult(), [], [], weekly);
    expect(findRec(recs, 'trend-worsening')).toBeDefined();
  });

  it('never returns more than 7 recommendations', () => {
    // Stack up as many triggers as possible at once.
    const form = baseForm({
      sleepHours: 3,
      emotionalOverwhelm: 5,
      mentallyExhausted: 5,
      emotionallyDrained: 5,
      tasksAssigned: 20,
      tasksCompleted: 2,
      breaksTaken: 0,
      mood: 1,
      physicalTiredness: 5,
      difficultSituations: 7,
      hoursCaregiving: 10,
    });
    const recs = generateRecommendations(form, baseResult({ stressLevel: 'High' }));
    expect(recs.length).toBeLessThanOrEqual(7);
  });
});

describe('getSummaryMessage', () => {
  it('produces a High-stress-specific message', () => {
    const msg = getSummaryMessage(
      baseForm({ difficultSituations: 3 }),
      baseResult({ stressLevel: 'High' }),
    );
    expect(msg).toContain('tough day');
    expect(msg).toContain('3 difficult situations');
  });

  it('produces a Low-stress-specific message', () => {
    const msg = getSummaryMessage(baseForm(), baseResult({ stressLevel: 'Low' }));
    expect(msg).toContain('Excellent work today');
  });
});