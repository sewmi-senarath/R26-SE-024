const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildScoreSnapshot,
} = require("../../../src/services/cognitive/scoringService");
const {
  validateCreateSession,
  validateAnswerPayload,
} = require("../../../src/services/cognitive/validationService");

function question(overrides = {}) {
  return {
    questionId: "q1",
    section: "Orientation",
    type: "mcq",
    expectedAnswers: ["Saturday"],
    maxScore: 1,
    ...overrides,
  };
}

function snapshotFor(testQuestion, answer, sessionOverrides = {}) {
  return buildScoreSnapshot([testQuestion], {
    answers: { [testQuestion.questionId]: answer },
    registrationWords: [],
    ...sessionOverrides,
  });
}

test("scores an MCQ after trimming whitespace and normalising case", () => {
  const result = snapshotFor(question(), "  saturday  ");

  assert.equal(result.totalScore, 1);
  assert.equal(result.scoringLog[0].earned, 1);
});

test("counts each recalled target word only once", () => {
  const recallQuestion = question({
    type: "word_recall_input",
    section: "Recall",
    words: ["Apple", "Table", "Penny"],
    maxScore: 3,
  });

  const result = snapshotFor(recallQuestion, ["apple", "APPLE", "table", "chair"]);

  assert.equal(result.sectionScores.Recall, 2);
  assert.equal(result.totalScore, 2);
});

test("uses the patient's previous answer for serial-subtraction carry-forward scoring", () => {
  const subtractionQuestion = question({
    type: "serial_subtraction",
    section: "Attention",
    expectedAnswers: ["93", "86", "79", "72", "65"],
    maxScore: 5,
  });

  const result = snapshotFor(subtractionQuestion, ["92", "85", "78", "71", "64"]);

  assert.equal(result.sectionScores.Attention, 4);
  assert.equal(result.totalScore, 4);
});

test("classifies a total score of 19 as mild impairment", () => {
  const highValueQuestion = question({ maxScore: 19 });
  const result = snapshotFor(highValueQuestion, "Saturday");

  assert.equal(result.totalScore, 19);
  assert.equal(result.severity, "mild");
  assert.equal(result.impairmentFlag, true);
});

test("validates cognitive-session and answer payloads without rejecting a zero answer", () => {
  assert.throws(
    () => validateCreateSession({ patientId: "patient-1" }),
    (error) =>
      error.statusCode === 400 &&
      error.details.missing.includes("caregiverId"),
  );
  assert.doesNotThrow(() =>
    validateCreateSession({ patientId: "patient-1", caregiverId: "caregiver-1" }),
  );
  assert.doesNotThrow(() =>
    validateAnswerPayload({ questionId: "q1", answer: 0 }),
  );
  assert.throws(
    () => validateAnswerPayload({ questionId: "q1" }),
    /answer is required/,
  );
});
