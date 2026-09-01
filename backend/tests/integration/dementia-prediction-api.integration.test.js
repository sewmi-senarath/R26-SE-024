const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

process.env.NODE_ENV = "test";

// Bypass auth: patch the middleware module BEFORE the route file destructures it.
const auth = require("../../src/middleware/auth");
auth.protect = (req, _res, next) => {
  req.user = { userId: "caregiver-1", role: "caregiver" };
  next();
};
auth.authorize = () => (_req, _res, next) => next();

const svc = require("../../src/services/cognitive/dementiaPrediction/dementiaPredictionService");
const User = require("../../src/models/auth/User");
const Patient = require("../../src/models/caregiver/Patient");
const Assessment = require("../../src/models/cognitive/Assessment");
const dementiaRoutes = require("../../src/routes/cognitive/dementiaPredictionRoutes");
const { errorHandler } = require("../../src/middleware/errorHandler");

const originals = {
  saveFaq: svc.saveFaq,
  getLatestFaq: svc.getLatestFaq,
  requestPrediction: svc.requestPrediction,
  persistPrediction: svc.persistPrediction,
  userFindById: User.findById,
  patientFindOne: Patient.findOne,
  assessmentFindOne: Assessment.findOne,
};

const FAQ_ANSWERS = {
  bills: 0, taxes: 1, shopping: 0, games: 2, stove: 0,
  mealPrep: 1, events: 0, payAttention: 0, remindDates: 2, travel: 1,
};

const ML_OK = {
  success: true,
  triage: "escalate",
  confidence: 0.91,
  probabilities: { monitor: 0.09, escalate: 0.91 },
  message: "A clinical review is recommended.",
  submittedAt: "2026-08-30T10:00:00.000Z",
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
  // The routes require caregivers to be linked to the patient. Keep this
  // integration test independent of MongoDB while exercising that guard.
  Patient.findOne = async () => ({
    caregiverId: "caregiver-1",
    registeredPatientId: "patient-1",
  });
  User.findById = async () => ({ _id: "patient-1", age: 74, gender: "female" });
  Assessment.findOne = () => ({
    sort: async () => ({ sessionId: "session-1", totalScore: 21, adjustedScore: null }),
  });

  const app = express();
  app.use(express.json());
  app.use("/api/cognitive/dementia", dementiaRoutes);
  app.use(errorHandler);

  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  Object.assign(svc, {
    saveFaq: originals.saveFaq,
    getLatestFaq: originals.getLatestFaq,
    requestPrediction: originals.requestPrediction,
    persistPrediction: originals.persistPrediction,
  });
  User.findById = originals.userFindById;
  Patient.findOne = originals.patientFindOne;
  Assessment.findOne = originals.assessmentFindOne;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /faq/:patientId stores the questionnaire and returns 201", async () => {
  let received;
  svc.saveFaq = async (patientId, answers, sessionId) => {
    received = { patientId, answers, sessionId };
    return { _id: "faq-1", patientId, total: 7, ...answers };
  };

  const { response, body } = await request("/api/cognitive/dementia/faq/patient-1", {
    method: "POST",
    body: JSON.stringify({ answers: FAQ_ANSWERS, sessionId: "session-1" }),
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.result._id, "faq-1");
  assert.deepEqual(received, {
    patientId: "patient-1",
    answers: FAQ_ANSWERS,
    sessionId: "session-1",
  });
});

test("POST /faq/:patientId falls back to the latest completed assessment when no sessionId is sent", async () => {
  let received;
  svc.saveFaq = async (patientId, answers, sessionId) => {
    received = { patientId, answers, sessionId };
    return { _id: "faq-2", patientId, total: 7, ...answers };
  };

  const { response, body } = await request("/api/cognitive/dementia/faq/patient-1", {
    method: "POST",
    body: JSON.stringify({ answers: FAQ_ANSWERS }),
  });

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  // Assessment.findOne mock resolves to sessionId "session-1".
  assert.equal(received.sessionId, "session-1");
});

test("POST /faq/:patientId surfaces a 400 from the service for bad answers", async () => {
  svc.saveFaq = async () => {
    const err = new Error("faq answers must be integers 0-3");
    err.statusCode = 400;
    err.details = { invalid: ["bills"] };
    throw err;
  };

  const { response, body } = await request("/api/cognitive/dementia/faq/patient-1", {
    method: "POST",
    body: JSON.stringify({ answers: { ...FAQ_ANSWERS, bills: 9 } }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /integers 0-3/);
  assert.deepEqual(body.details, { invalid: ["bills"] });
});

test("POST /predict/:patientId returns 409 FAQ_REQUIRED when no questionnaire exists", async () => {
  svc.getLatestFaq = async () => null;

  const { response, body } = await request("/api/cognitive/dementia/predict/patient-1", {
    method: "POST",
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
  assert.equal(body.code, "FAQ_REQUIRED");
});

test("POST /predict/:patientId returns the triage result on the happy path", async () => {
  svc.getLatestFaq = async () => ({ _id: "faq-1", ...FAQ_ANSWERS });
  let predictionArgs;
  svc.requestPrediction = async (args) => {
    predictionArgs = args;
    return ML_OK;
  };
  let persisted = false;
  svc.persistPrediction = async () => {
    persisted = true;
    return { _id: "pred-1" };
  };

  const { response, body } = await request("/api/cognitive/dementia/predict/patient-1", {
    method: "POST",
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.result.triage, "escalate");
  assert.equal(body.result.probabilities.escalate, 0.91);
  assert.equal(body.result.confidence, 0.91);
  assert.equal(body.result.basedOnAssessment, "session-1");
  assert.equal(body.result.basedOnFaq, "faq-1");
  assert.equal(predictionArgs.faq._id, "faq-1");
  assert.equal(persisted, true);
});

test("POST /predict/:patientId maps a refused ML connection to 503", async () => {
  svc.getLatestFaq = async () => ({ _id: "faq-1", ...FAQ_ANSWERS });
  svc.requestPrediction = async () => {
    const err = new Error("connect ECONNREFUSED 127.0.0.1:5002");
    err.code = "ECONNREFUSED";
    throw err;
  };

  const { response, body } = await request("/api/cognitive/dementia/predict/patient-1", {
    method: "POST",
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.match(body.message, /ML service not running/);
});
