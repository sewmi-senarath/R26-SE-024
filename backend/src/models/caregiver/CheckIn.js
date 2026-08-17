const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    caregiverId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Caregiver',
      required: true,
    },

    // Form data
    sleepHours:          { type: Number, default: 7 },
    physicalTiredness:   { type: Number, default: 3 },
    mood:                { type: Number, default: 3 },
    emotionalOverwhelm:  { type: Number, default: 3 },
    hoursCaregiving:     { type: Number, default: 8 },
    tasksAssigned:       { type: Number, default: 10 },
    tasksCompleted:      { type: Number, default: 8 },
    difficultSituations: { type: Number, default: 2 },
    breaksTaken:         { type: Number, default: 1 },
    mentallyExhausted:   { type: Number, default: 3 },
    difficultyManaging:  { type: Number, default: 3 },
    emotionallyDrained:  { type: Number, default: 3 },

    // ML prediction result
    stressLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      default: 'Moderate',
    },
    stressScore:  { type: Number, default: 5 },
    confidence:   { type: Number, default: 0.5 },

    // Burnout risk
    burnoutRiskScore: { type: Number, default: 0 },
    burnoutRiskLevel: {
      type:    String,
      enum:    ['Low', 'Moderate', 'High'],
      default: 'Low',
    },

    // Date of check-in (YYYY-MM-DD)
    checkInDate: { type: String, required: true },
  },
  { timestamps: true }
);

// One check-in per caregiver per day
checkInSchema.index(
  { caregiverId: 1, checkInDate: 1 },
  { unique: true }
);

module.exports = mongoose.model('CheckIn', checkInSchema);