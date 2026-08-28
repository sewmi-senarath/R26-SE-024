const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    timeTaken: { type: Number, required: true, min: 0 },
    correctAnswers: { type: Number, required: true, min: 0 },
    totalAnswers: { type: Number, required: true, min: 0 },
    completedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: "game_sessions" },
);

GameSessionSchema.index({ patientId: 1, completedAt: -1 });

module.exports = mongoose.model("GameSession", GameSessionSchema);
