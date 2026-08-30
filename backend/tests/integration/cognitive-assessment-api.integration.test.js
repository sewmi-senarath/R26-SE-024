const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

process.env.NODE_ENV = "test";

const assessmentService = require("../../src/services/cognitive/assessmentService");
const assessmentRoutes = require("../../src/routes/cognitive/assessmentRoutes");
const { errorHandler } = require("../../src/middleware/errorHandler");

const originalServiceMethods = {
  createAssessmentSession: assessmentService.createAssessmentSession,
  submitAnswer: assessmentService.submitAnswer,
  updateProgress: assessmentService.updateProgress,
  completeAssessment: assessmentService.completeAssessment,
};

let server;
let baseUrl;

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/cognitive/assessments", assessmentRoutes);
  app.use(errorHandler);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  Object.assign(assessmentService, originalServiceMethods);
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /assessments creates a cognitive assessment through the HTTP layer", async () => {
  let receivedPayload;
  assessmentService.createAssessmentSession = async (payload) => {
    receivedPayload = payload;
    return { sessionId: "session-1", status: "active", totalQuestions: 30 };
  };

  const payload = {
    patientId: "patient-1",
    caregiverId: "caregiver-1",
    locale: "en-LK",
  };
  const { response, body } = await request("/api/cognitive/assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.message, "Assessment session created");
  assert.equal(body.data.session.sessionId, "session-1");
  assert.deepEqual(receivedPayload, payload);
});

test("POST /assessments returns a structured 400 response for missing identifiers", async () => {
  const { response, body } = await request("/api/cognitive/assessments", {
    method: "POST",
    body: JSON.stringify({ patientId: "patient-1" }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error.message, "Missing required fields");
  assert.deepEqual(body.error.details.missing, ["caregiverId"]);
});

test("PATCH /assessments/:sessionId/answer submits an answer to the service", async () => {
  let received;
  assessmentService.submitAnswer = async (sessionId, payload) => {
    received = { sessionId, payload };
    return { sessionId, answers: { [payload.questionId]: payload.answer } };
  };

  const payload = { questionId: "orientation-day", answer: "Saturday", timeSpentMs: 900 };
  const { response, body } = await request(
    "/api/cognitive/assessments/session-1/answer",
    { method: "PATCH", body: JSON.stringify(payload) },
  );

  assert.equal(response.status, 200);
  assert.equal(body.data.session.answers["orientation-day"], "Saturday");
  assert.deepEqual(received, { sessionId: "session-1", payload });
});

test("PATCH /assessments/:sessionId/progress persists patient progress", async () => {
  let received;
  assessmentService.updateProgress = async (sessionId, payload) => {
    received = { sessionId, payload };
    return { sessionId, ...payload };
  };

  const payload = { currentQuestionIndex: 7, timeLimit: 30, timeExpired: false };
  const { response, body } = await request(
    "/api/cognitive/assessments/session-1/progress",
    { method: "PATCH", body: JSON.stringify(payload) },
  );

  assert.equal(response.status, 200);
  assert.equal(body.data.session.currentQuestionIndex, 7);
  assert.deepEqual(received, { sessionId: "session-1", payload });
});

test("POST /assessments/:sessionId/complete returns the completed scored session", async () => {
  let receivedSessionId;
  assessmentService.completeAssessment = async (sessionId) => {
    receivedSessionId = sessionId;
    return { sessionId, status: "done", totalScore: 25, severity: "none" };
  };

  const { response, body } = await request(
    "/api/cognitive/assessments/session-1/complete",
    { method: "POST" },
  );

  assert.equal(response.status, 200);
  assert.equal(body.data.session.status, "done");
  assert.equal(body.data.session.totalScore, 25);
  assert.equal(receivedSessionId, "session-1");
});
