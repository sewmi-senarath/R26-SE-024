const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    dose:         { type: String, required: true },
    form:         { type: String, default: 'Tablet' },
    notes:        { type: String, default: '' },
    time:         { type: String, required: true },
    timeSlot:     { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
    status:       { type: String, enum: ['taken', 'pending', 'missed'], default: 'pending' },
    streak:       { type: Number, default: 0 },
    patientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName:  { type: String, required: true },
    patientInitials: { type: String, required: true },
    patientColor: { type: String, default: '#4F8EF7' },
    caregiverId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medication', medicationSchema);