// Run from inside your backend/ folder:  node seedBurnoutTest.js
// Requires the same .env (MONGO_URI) your server already uses.

require('dotenv').config();
const mongoose = require('mongoose');
const CheckIn  = require('../models/caregiver/CheckIn');

// ← PASTE YOUR REAL caregiverId HERE (from the Metro console log)
const CAREGIVER_ID = 'PASTE_YOUR_CAREGIVER_ID_HERE';

const dateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Pick ONE scenario below by commenting/uncommenting, or run all three
// separately (delete previous test docs between runs if you want a clean slate).

// ── Scenario A: sustained-stress + trend-worsening ─────────────────────────
// 3 days ago = Moderate, 2 days ago = High, yesterday = High.
// Today's real check-in (submitted through the app) becomes day 4.
const scenarioA = [
  { daysAgo: 3, stressLevel: 'Moderate', stressScore: 6, sleepHours: 6 },
  { daysAgo: 2, stressLevel: 'High',     stressScore: 8, sleepHours: 5 },
  { daysAgo: 1, stressLevel: 'High',     stressScore: 9, sleepHours: 5 },
];

// ── Scenario B: chronic-sleep (low weekly avg, but today's sleep is fine) ──
const scenarioB = [
  { daysAgo: 3, stressLevel: 'Moderate', stressScore: 5, sleepHours: 4 },
  { daysAgo: 2, stressLevel: 'Moderate', stressScore: 6, sleepHours: 5 },
  { daysAgo: 1, stressLevel: 'Moderate', stressScore: 5, sleepHours: 4 },
];
// Then in the app, submit today's real check-in with sleepHours >= 6.

// ── Scenario C: trend-improving ─────────────────────────────────────────────
const scenarioC = [
  { daysAgo: 4, stressLevel: 'High',     stressScore: 9, sleepHours: 4 },
  { daysAgo: 3, stressLevel: 'High',     stressScore: 8, sleepHours: 5 },
  { daysAgo: 2, stressLevel: 'Moderate', stressScore: 6, sleepHours: 6 },
  { daysAgo: 1, stressLevel: 'Low',      stressScore: 3, sleepHours: 7 },
];

const SCENARIO = scenarioA; // ← change to scenarioB / scenarioC to test the others

const run = async () => {
  if (CAREGIVER_ID === 'PASTE_YOUR_CAREGIVER_ID_HERE') {
    console.error('❌ Edit this file and paste your real caregiverId first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const day of SCENARIO) {
    const checkInDate = dateStr(day.daysAgo);
    await CheckIn.findOneAndUpdate(
      { caregiverId: CAREGIVER_ID, checkInDate },
      {
        caregiverId: CAREGIVER_ID,
        checkInDate,
        sleepHours:          day.sleepHours,
        physicalTiredness:   3,
        mood:                3,
        emotionalOverwhelm:  3,
        hoursCaregiving:     8,
        tasksAssigned:       10,
        tasksCompleted:      8,
        difficultSituations: 2,
        breaksTaken:         1,
        mentallyExhausted:   3,
        difficultyManaging:  3,
        emotionallyDrained:  3,
        stressLevel: day.stressLevel,
        stressScore: day.stressScore,
        confidence:  0.85,
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded ${checkInDate}: ${day.stressLevel} (${day.stressScore}/10)`);
  }

  console.log('\nDone. Now open the app and submit TODAY\'s real check-in through the normal form.');
  console.log('Then tap "View My Action Plan" and look for the new cards.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});