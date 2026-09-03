const mongoose = require('mongoose');

const PersonalObjectSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientRegistry',
    required: true
  },
  itemType: { type: String, enum: ['object', 'person'], default: 'object' },
  relationship: { type: String },
  objectName: {
    type: String,
    required: true
  },
  detectedLabels: [{
    type: String
  }],
  detections: [{
    class_id: Number,
    class_name: String,
    confidence: Number,
    bbox_xyxy: [Number],
    bbox_xywh: [Number]
  }],
  imageUrl: {
    type: String,
    required: true
  },
  trainingStatus: {
    type: String,
    enum: ['pending', 'trained'],
    default: 'pending'
  },
  embedding: [{ type: Number }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PersonalObject', PersonalObjectSchema);
