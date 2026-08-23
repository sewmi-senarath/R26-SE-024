const mongoose = require('mongoose');

// One row per behavioral risk-screener submission (backend/ml/dementia/
// train_screener.py). patientId is intentionally NOT a strict `ref` lookup
// target - it may be a real registered User (patient self-flow) or a
// caregiver-only Patient record with no login of its own. Either way the
// same id is used consistently when submitting and when reading history, so
// per-patient history still works regardless of which case applies.
const RiskScreeningSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // Snapshot of what was answered, for audit / "what changed since last time"
    checklist: {
      memoryComplaints: Boolean,
      behavioralProblems: Boolean,
      confusion: Boolean,
      disorientation: Boolean,
      personalityChanges: Boolean,
      difficultyCompletingTasks: Boolean,
      forgetfulness: Boolean,
    },
    riskProbability: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true,
    },
    topFactors: { type: [String], default: [] },
    message: { type: String, default: '' },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    }, // whoever was logged in when they filled the checklist
  },
  { timestamps: true, collection: 'risk_screenings' }
);

RiskScreeningSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('RiskScreening', RiskScreeningSchema);
