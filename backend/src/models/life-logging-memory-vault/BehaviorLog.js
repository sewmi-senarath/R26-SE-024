const mongoose = require('mongoose');

const behaviorLogSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  size: { type: String },
  dateUploaded: { type: Date, default: Date.now },
  status: { type: String, enum: ['Completed', 'Error', 'Processing'], default: 'Processing' },
  processedNodes: { type: Number, default: 0 },
  aiConfidence: { type: Number, default: 0 },
  type: { type: String, enum: ['Behavioral', 'Sensor', 'Manual'], default: 'Behavioral' }
});

module.exports = mongoose.model('BehaviorLog', behaviorLogSchema);
