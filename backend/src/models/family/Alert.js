const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  sentTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
    required: true,
  },
  type: {
    type: String,
    enum: ['positive', 'checkin', 'urgent'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  suggestedAction: {
    type: String,
  },
  memoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);