const mongoose = require("mongoose");
const { SectionScoresSchema, ScoringLogEntrySchema } = require('./ScoringLog');

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    caregiverId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["idle", "active", "done", "abandoned"],
      default: "idle",
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    questionSetVersion: { type: Number, default: 1 },

    answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    answeredAt: { type: Map, of: Number, default: {} },
    timePerQuestion: { type: Map, of: Number, default: {} },
    attemptCount: { type: Map, of: Number, default: {} },
    skipped: { type: [String], default: [] },
    registrationWords: { type: [String], default: [] },

    sectionScores: { type: SectionScoresSchema, default: () => ({}) },
    totalScore: { type: Number, default: 0 },
    attentionMethod: { type: String, enum: ["serial7", "world"], default: "serial7" },
    adjustedScore: { type: Number, default: null },
    impairmentFlag: { type: Boolean, default: false },
    severity: { type: String, enum: ["none", "mild", "moderate", "severe"], default: "none" },
    scoringLog: { type: [ScoringLogEntrySchema], default: [] },

    serial7Attempted: { type: Boolean, default: false },
    worldSpellingFallback: { type: Boolean, default: false },
    recallWordsShown: { type: Boolean, default: false },

    questionStartTime: { type: Number, default: 0 },
    timeLimit: { type: Number, default: null },
    timeExpired: { type: Boolean, default: false },

    locale: { type: String, default: "en-AU" },
    administrationMode: { type: String, enum: ["assisted", "self"], default: "assisted" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "assessments" }
);

AssessmentSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model("Assessment", AssessmentSchema);