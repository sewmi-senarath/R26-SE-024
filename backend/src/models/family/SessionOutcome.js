const mongoose = require('mongoose');

const sessionOutcomeSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  memoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory',
  },
  moodBefore: {
    type: Number,
  },
  moodAfter: {
    type: Number,
  },
  moodLift: {
    type: Number,
  },
  engagementDuration: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SessionOutcome', sessionOutcomeSchema);