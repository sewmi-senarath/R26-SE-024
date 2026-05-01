/* eslint-disable no-console */
require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Question = require("../models/cognitive/Question");

// IMPORTANT:
// This imports your frontend question bank directly.
// If your monorepo path differs, adjust ../../.. part.
const { MMSE_QUESTIONS } = require("./questions.seed.js");

function toQuestionDoc(q, index) {
  return {
    questionId: q.id,
    order: index + 1,
    version: 1,
    isActive: true,

    section: q.section,
    type: q.type,
    prompt: q.prompt,
    subPrompt: q.subPrompt || "",
    options: q.options || [],
    image: q.image || "",
    imageDescription: q.imageDescription || "",
    expectedAnswers: q.expectedAnswers || [],
    words: q.words || [],
    timeLimit: typeof q.timeLimit === "number" ? q.timeLimit : null,
    maxScore: q.maxScore,
    maxAttempts: typeof q.maxAttempts === "number" ? q.maxAttempts : null,
    referenceAsset: q.referenceAsset || "",
    instructionSteps: q.instructionSteps || [],
    phrase: q.phrase || "",
  };
}

function validateQuestionShape(q) {
  const errors = [];

  if (!q.id) errors.push("id is required");
  if (!q.section) errors.push("section is required");
  if (!q.type) errors.push("type is required");
  if (!q.prompt) errors.push("prompt is required");
  if (typeof q.maxScore !== "number") errors.push("maxScore must be number");

  if (["mcq", "image_mcq"].includes(q.type)) {
    if (!Array.isArray(q.options) || q.options.length === 0) {
      errors.push("options required for mcq/image_mcq");
    }
    if (!Array.isArray(q.expectedAnswers) || q.expectedAnswers.length === 0) {
      errors.push("expectedAnswers required for mcq/image_mcq");
    }
  }

  if (q.type === "serial_subtraction") {
    if (!Array.isArray(q.expectedAnswers) || q.expectedAnswers.length === 0) {
      errors.push("expectedAnswers required for serial_subtraction");
    }
  }

  return errors;
}

async function run() {
  await connectDB();

  if (!Array.isArray(MMSE_QUESTIONS) || MMSE_QUESTIONS.length === 0) {
    throw new Error("MMSE_QUESTIONS is empty or not found.");
  }

  // 1) validate frontend data before touching DB
  const shapeErrors = [];
  MMSE_QUESTIONS.forEach((q) => {
    const errs = validateQuestionShape(q);
    if (errs.length) shapeErrors.push({ id: q.id, errors: errs });
  });

  if (shapeErrors.length) {
    console.error("Question validation failed:", JSON.stringify(shapeErrors, null, 2));
    process.exit(1);
  }

  // 2) upsert each question by stable key (questionId)
  const ops = MMSE_QUESTIONS.map((q, index) => ({
    updateOne: {
      filter: { questionId: q.id },
      update: { $set: toQuestionDoc(q, index) },
      upsert: true,
    },
  }));

  const result = await Question.bulkWrite(ops, { ordered: false });

  // 3) optional: deactivate stale questions not in frontend list
  const activeIds = MMSE_QUESTIONS.map((q) => q.id);
  const staleRes = await Question.updateMany(
    { questionId: { $nin: activeIds } },
    { $set: { isActive: false } }
  );

  console.log("Seed completed");
  console.log({
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
    staleDeactivated: staleRes.modifiedCount,
  });

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.connection.close();
  process.exit(1);
});