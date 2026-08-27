const mongoose = require('mongoose');

const emotionLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  sessionId: {
    type: String,
  },
  memoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Memory',
  },
  emotion: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'angry', 'fear',
           'surprise', 'disgust', 'neutral'],
  },
  score: {
    type: Number,
    required: true,
  },
  isBaseline: {
    type: Boolean,
    default: false,
  },
  triggeredAlert: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('EmotionLog', emotionLogSchema);