const mongoose = require("mongoose");

// A small rolling record of the content a patient has recently been shown for
// one game, so the content service can avoid repeating items across the next
// few sessions. Keys are normalized item labels/words - stable across the LLM,
// rule-based, and static tiers - never the tier-specific ids.
const PatientContentHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: String,
      enum: ["memory_recall", "object_recall", "word_puzzle"],
      required: true,
    },
    // Ordered oldest -> newest; trimmed to a rolling window by the service.
    recentKeys: { type: [String], default: [] },
  },
  { timestamps: true, collection: "patient_content_history" }
);

PatientContentHistorySchema.index({ patientId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model("PatientContentHistory", PatientContentHistorySchema);
