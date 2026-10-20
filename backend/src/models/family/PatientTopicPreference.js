const mongoose = require('mongoose');

// family-scoped only — does NOT touch the shared caregiver/Patient model.
// Used by the `pause_topic` action: marks a memory category as sensitive
// for a patient so getCategoryRecommendation (and any future suggestion
// logic) can exclude it.
const patientTopicPreferenceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    category: {
      type: String,
      enum: ['wedding', 'festival', 'temple', 'career', 'food', 'travel',
             'birthday', 'childhood', 'friends', 'home', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sensitive'],
      default: 'sensitive',
    },
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    setAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// one preference per patient+category — pause_topic always upserts
patientTopicPreferenceSchema.index({ patientId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('PatientTopicPreference', patientTopicPreferenceSchema);
