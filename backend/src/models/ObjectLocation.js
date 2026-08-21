const mongoose = require('mongoose');

const ObjectLocationSchema = new mongoose.Schema({
  patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  objectName:     { type: String, required: true, lowercase: true, trim: true },
  roomLabel:      { type: String, default: 'Unknown' },
  locationDetail: { type: String, default: '' },
  // GPS coordinates at time of detection
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  confidence:   { type: Number, default: 0 },   // YOLO confidence score 0-100
  detectedBy:   { type: String, default: 'camera' },
  detectedAt:   { type: Date, default: Date.now },
});

ObjectLocationSchema.index({ patientId: 1, objectName: 1, detectedAt: -1 });

module.exports = mongoose.models.ObjectLocation
  || mongoose.model('ObjectLocation', ObjectLocationSchema);
