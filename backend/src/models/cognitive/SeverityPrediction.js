const mongoose = require('mongoose');

// One row per call to the severity classifier (backend/ml/dementia/train.py).
// Persisted so the Reporting tab can chart severity + confidence over time,
// not just show whatever the last live prediction happened to be.
const SeverityPredictionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    basedOnAssessment: { type: String, default: null }, // Assessment.sessionId
    severity: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
      required: true,
    },
    confidence: { type: Number, required: true },
    probabilities: {
      none: Number,
      mild: Number,
      moderate: Number,
      severe: Number,
    },
    ruleBasedSeverity: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe'],
    },
    agreesWithRule: { type: Boolean, default: true },
    message: { type: String, default: '' },
  },
  { timestamps: true, collection: 'severity_predictions' }
);

SeverityPredictionSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('SeverityPrediction', SeverityPredictionSchema);
