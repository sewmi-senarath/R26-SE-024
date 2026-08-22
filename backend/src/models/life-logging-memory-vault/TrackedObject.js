const mongoose = require('mongoose');

const trackedObjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  lastSeen: { type: Date, default: Date.now },
  beaconHealth: { type: Number, default: 100 },
  status: { type: String, enum: ['Detected', 'Lost Contact', 'Moved'], default: 'Detected' },
  roomContext: { type: String },
  imageUrl: { type: String } // Cloudinary URL
});

module.exports = mongoose.model('TrackedObject', trackedObjectSchema);
