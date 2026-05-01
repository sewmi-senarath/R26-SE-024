const mongoose = require("mongoose");

const MCQOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, unique: true, index: true },
    order: { type: Number, required: true, index: true },
    version: { type: Number, default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },

    section: {
      type: String,
      enum: ["Orientation", "Registration", "Attention", "Recall", "Language"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "mcq",
        "text_input",
        "word_recall_display",
        "word_recall_input",
        "serial_subtraction",
        "drawing_canvas",
        "instruction_action",
        "phrase_repeat",
        "image_mcq",
      ],
      required: true,
    },

    prompt: { type: String, required: true },
    subPrompt: { type: String, default: "" },
    options: { type: [MCQOptionSchema], default: [] },
    image: { type: String, default: "" },
    imageDescription: { type: String, default: "" },
    expectedAnswers: { type: [String], default: [] },
    words: { type: [String], default: [] },
    timeLimit: { type: Number, default: null },
    maxScore: { type: Number, required: true },
    maxAttempts: { type: Number, default: null },
    referenceAsset: { type: String, default: "" },
    instructionSteps: { type: [String], default: [] },
    phrase: { type: String, default: "" },
  },
  { timestamps: true, collection: "questions" }
);

module.exports = mongoose.model("Question", QuestionSchema);