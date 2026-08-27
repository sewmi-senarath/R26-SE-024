const FamilyPatientProfile = require('../../models/family/FamilyPatientProfile');
const Patient = require('../../models/Patient');

const upsertFamilyProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { spouse, children, hometown, occupation, favouriteFood, importantPlaces } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const profile = await FamilyPatientProfile.findOneAndUpdate(
      { patientId },
      { spouse, children, hometown, occupation, favouriteFood, importantPlaces },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFamilyProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const profile = await FamilyPatientProfile.findOne({ patientId });

    res.status(200).json({ success: true, profile: profile || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { upsertFamilyProfile, getFamilyProfile };