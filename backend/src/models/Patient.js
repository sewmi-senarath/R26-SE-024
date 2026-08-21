const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  // General Info
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  customerCode: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  nic: { type: String, required: true },
  dob: { type: Date, required: true },
  joiningDate: { type: Date, required: true },
  registrationNumber: { type: String, required: true },
  
  // Contact
  mobile: { type: String, required: true },
  homePhone: { type: String },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  addressLine3: { type: String },

  // Biometrics
  patientImage: { type: String }, // Cloudinary URL
  faceEmbedding: { type: [Number], default: null }, // 512-dim face feature vector
  isFaceRegistered: { type: Boolean, default: false },

  // Dependant / Guardian
  guardian: {
    name: { type: String },
    nic: { type: String },
    relationship: { type: String },
    image: { type: String } // Cloudinary URL
  },

  // Behavior Patterns / Routines
  routines: [{
    task: { type: String },
    time: { type: String }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PatientRegistry || mongoose.model('PatientRegistry', PatientSchema);
