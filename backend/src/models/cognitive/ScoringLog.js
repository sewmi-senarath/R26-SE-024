const mongoose = require('mongoose');

const SectionScoresSchema = new mongoose.Schema(
    {
      Orientation: { type: Number, default: 0 },
      Registration: { type: Number, default: 0 },
      Attention: { type: Number, default: 0 },
      Recall: { type: Number, default: 0 },
      Language: { type: Number, default: 0 },
    },
    { _id: false }
  );
  
  const ScoringLogEntrySchema = new mongoose.Schema(
    {
      questionId: { type: String, required: true },
      earned: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    { _id: false }
  );

module.exports = {
    SectionScoresSchema,
    ScoringLogEntrySchema,
};
  