const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  time:      { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const patientSchema = new mongoose.Schema(
  {
    name:                  { type: String, required: [true, 'Name is required'], trim: true },
    initials:              { type: String, required: true },
    age:                   { type: Number, required: [true, 'Age is required'], min: 1, max: 120 },
    condition:             { type: String, enum: ['Mild', 'Moderate', 'Critical', 'Stable'], required: true },
    stage:                 { type: String, required: [true, 'Stage is required'] },
    avatarColor:           { type: String, default: '#4F8EF7' },
    emoji:                 { type: String, default: '🙂' },
    lastChecked:           { type: String, default: 'Just now' },
    condition_notes:       { type: String, default: 'No notes added' },
    condition_description: { type: String, default: 'No description provided.' },
    routines:              { type: [routineSchema], default: [] },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);