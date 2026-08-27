const mongoose = require('mongoose');

const familyPatientProfileSchema = new mongoose.Schema(
  {
    // links to the shared Patient document — never modifies it
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true,
    },

    // fields needed for AI story personalisation
    spouse:          { type: String, default: '' },
    children:        { type: [String], default: [] },
    hometown:        { type: String, default: '' },
    occupation:      { type: String, default: '' },
    favouriteFood:   { type: String, default: '' },
    importantPlaces: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FamilyPatientProfile', familyPatientProfileSchema);