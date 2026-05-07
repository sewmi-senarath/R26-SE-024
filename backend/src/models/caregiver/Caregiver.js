// backend/src/models/caregiver/Caregiver.js
const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema(
  {
    name:             { type: String, required: [true, 'Name is required'], trim: true },
    role:             { type: String, default: 'Caregiver' },
    email:            { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
    initials:         { type: String },
    avatarColor:      { type: String, default: '#2563EB' },
    profileImage:     { type: String, default: null }, // stores base64 string
    isOnline:         { type: Boolean, default: true },
    shiftsCompleted:  { type: Number, default: 0 },
    patientsAssigned: { type: Number, default: 0 },
    hoursThisWeek:    { type: Number, default: 0 },
    password:         { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Caregiver', caregiverSchema);