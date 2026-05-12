const mongoose = require('mongoose');

const BehaviorLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRegistry', required: true },
  date: { type: String, required: true },        // "2026-05-01"
  time: { type: String, required: true },        // "08:00"
  hour: { type: Number },                        // 8 (derived)
  dayOfWeek: { type: Number },                   // 0=Mon (derived)
  activity: { type: String, required: true },    // "eating"
  duration: { type: Number, default: 0 },        // minutes
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  source: { type: String, default: 'manual' },   // "csv" | "mobile" | "manual"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PatientBehaviorLog || mongoose.model('PatientBehaviorLog', BehaviorLogSchema);
