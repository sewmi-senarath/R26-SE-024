const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String },
  imageUrl: { type: String, required: true }, // Cloudinary URL
  audioUrl: { type: String }, // Optional voice story
  description: { type: String },
  lastInteracted: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', memorySchema);
