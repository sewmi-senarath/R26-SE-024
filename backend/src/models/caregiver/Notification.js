const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    caregiverId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName:  { type: String, default: 'System' }, // who/what this is about - a patient's name, or "System" for caregiver-facing alerts
    message:      { type: String, required: true },
    severity:     { type: String, enum: ['urgent', 'warning', 'info'], default: 'info' },
    acknowledged: { type: Boolean, default: false },
    source:       { type: String, default: 'system' }, // e.g. 'burnout', 'medication', 'manual' - helps you trace what created it later
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);