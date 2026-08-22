const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: String },
  date: { type: Date, default: Date.now },
  description: { type: String },
  type: { type: String, enum: ['Nutrition', 'Activity', 'Safety', 'Hygiene'], default: 'Activity' },
  aiConfidence: { type: Number, required: true },
  isAnomaly: { type: Boolean, default: false },
  anomalyLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  clipAvailable: { type: Boolean, default: false }
});

module.exports = mongoose.model('Routine', routineSchema);
