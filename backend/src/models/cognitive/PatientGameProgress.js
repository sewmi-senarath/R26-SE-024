const mongoose = require("mongoose");

const GAME_IDS = [
  "memory_recall",
  "object_recall",
  "attention_game",
  "photo_puzzle",
  "word_puzzle",
  "orientation_game",
  "face_name_match",
  "grid_flash",
  "listen_repeat",
  "memory_match",
  "story_recall",
  "spot_difference",
  "go_no_go",
  "name_picture",
  "sentence_completion",
];

const DIFFICULTIES = ["easy", "medium", "hard"];

// One entry per automatic difficulty change, so the patient profile can show a
// full timeline of when and why the level moved.
const DifficultyChangeSchema = new mongoose.Schema(
  {
    from: { type: String, enum: DIFFICULTIES, required: true },
    to: { type: String, enum: DIFFICULTIES, required: true },
    direction: { type: String, enum: ["up", "down"], required: true },
    reason: { type: String, required: true },
    avgComposite: { type: Number, required: true },
    sessionComposite: { type: Number, required: true },
    at: { type: Date, required: true },
  },
  { _id: false },
);

// Adaptive-difficulty state for a single (patient, game) pair. Seeded from the
// difficulty the game was first played at (which comes from the assessment
// plan) and then driven entirely by measured performance from then on.
const PatientGameProgressSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: { type: String, enum: GAME_IDS, required: true },

    difficulty: { type: String, enum: DIFFICULTIES, required: true },

    totalSessions: { type: Number, required: true, default: 0, min: 0 },
    // Games played at the current difficulty since the last change - powers the
    // cooldown that stops the level oscillating every session.
    sessionsSinceLastChange: { type: Number, required: true, default: 0, min: 0 },

    // Composite performance scores (0-100) for recent sessions, newest last.
    // Capped to a short history - only the last few drive decisions, the rest
    // is kept for the trend chart in the report.
    recentScores: { type: [Number], default: [] },
    // Per-metric snapshot of the most recent session, surfaced in the report.
    lastMetrics: {
      accuracy: { type: Number, default: null },
      correctnessRate: { type: Number, default: null },
      speedScore: { type: Number, default: null },
      composite: { type: Number, default: null },
    },

    lastChangeAt: { type: Date, default: null },
    lastChangeReason: { type: String, default: null },
    changeHistory: { type: [DifficultyChangeSchema], default: [] },
  },
  { timestamps: true, collection: "patient_game_progress" },
);

PatientGameProgressSchema.index({ patientId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model("PatientGameProgress", PatientGameProgressSchema);
module.exports.GAME_IDS = GAME_IDS;
module.exports.DIFFICULTIES = DIFFICULTIES;
