const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
    required: true,
  },
  photoUrl: {
    type: String,
    required: true,
  },
  familyNote: {
    type: String,
  },
  aiPhotoDescription: {
    type: String,
  },
  generatedStory: {
    type: String,
  },
  generatedStorySinhala: {
    type: String,
  },
  audioUrl: {
    type: String,
  },
  category: {
    type: String,
    enum: ['wedding', 'festival', 'temple', 'career',
           'food', 'travel', 'birthday', 'childhood',
           'friends', 'home', 'other'],
    default: 'other',
  },
  playCount: {
    type: Number,
    default: 0,
  },
  avgMoodLift: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FamilyMemory', memorySchema);