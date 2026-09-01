require('dotenv').config();
const connectDB = require('../config/db');
const Patient = require('../models/caregiver/Patient');
const FamilyPatientProfile = require('../models/family/FamilyPatientProfile');
const User = require('../models/auth/User');

const seed = async () => {
  await connectDB();

  // find any existing caregiver user to link, or create a placeholder one
  let caregiver = await User.findOne({ role: 'caregiver' });

  if (!caregiver) {
    console.log('No caregiver user found — creating a placeholder one');
    caregiver = await User.create({
      fullName: 'Demo Caregiver',
      email: 'demo.caregiver@memocare.test',
      password: 'password123',
      role: 'caregiver',
    });
  }

  let patient = await Patient.findOne({ name: 'Margaret Hughes' });

  if (!patient) {
    patient = await Patient.create({
      name: 'Margaret Hughes',
      initials: 'MH',
      age: 74,
      condition: 'Moderate',
      stage: 'Early-Mid Stage',
      avatarColor: '#4F8EF7',
      caregiverId: caregiver._id,
    });
    console.log('✅ Patient created:', patient._id.toString());
  } else {
    console.log('Patient already exists:', patient._id.toString());
  }

  await FamilyPatientProfile.findOneAndUpdate(
    { patientId: patient._id },
    {
      spouse: 'Robert Hughes',
      children: ['Sarah', 'Tom'],
      hometown: 'Clifton',
      occupation: 'Retired teacher',
      favouriteFood: 'Sunday roast',
      importantPlaces: ['Clifton House', 'The Lake House'],
    },
    { upsert: true, new: true }
  );

  console.log('✅ Family profile linked to patient');
  console.log('');
  console.log('════════════════════════════════════════');
  console.log('Use this ID in familyService.ts:');
  console.log(patient._id.toString());
  console.log('════════════════════════════════════════');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});