const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: { type: [String], required: true }, // exactly 3
    correctOptionIndex: { type: Number, required: true }, // 0-2 — never serialized to the client until that question is answered
    sourceSnippet: { type: String, default: '' }, // short excerpt/paraphrase of generatedStory grounding this question — powers "re-read this part"; '' is valid, frontend falls back to the full story
    selectedOptionIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, default: null },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

const storyQuizAttemptSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    memoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMemory',
      required: true,
    },
    // same sessionId as the EmotionLog/SessionOutcome for this listen —
    // one quiz attempt per story-listening session, not per memory, so a
    // repeat listen gets its own fresh quiz + score
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    questions: {
      type: [quizQuestionSchema],
      required: true, // exactly 3
    },
    score: {
      type: Number,
      default: null, // 0-3, set once the 3rd question is answered
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    // the AI-fallback path never persists a document at all (see
    // storyQuizService.js), so this is always 'ai' today — kept for
    // provenance/future-proofing, same role FamilyEvent.cardTextSource plays
    generationSource: {
      type: String,
      enum: ['ai'],
      default: 'ai',
    },
    seenByFamilyAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

storyQuizAttemptSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('StoryQuizAttempt', storyQuizAttemptSchema);
