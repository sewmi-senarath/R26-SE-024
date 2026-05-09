const mongoose = require("mongoose");
const User = require("../../models/auth/User");

const patientProfileSelect =
  "fullName email age gender preferredLanguage cognitiveLevel hometown hobbies interests " +
  "familyMembers lifeEvents countriesLived occupations " +
  "favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports preferredSportsText languagesPreferred assignedCaregiverId " +
  "createdAt updatedAt";

const toPatientProfile = (patient) => ({
  id: patient._id,
  fullName: patient.fullName,
  email: patient.email,
  age: patient.age,
  gender: patient.gender,
  preferredLanguage: patient.preferredLanguage,
  cognitiveLevel: patient.cognitiveLevel,
  hometown: patient.hometown,
  hobbies: patient.hobbies,
  interests: patient.interests,
  familyMembers: patient.familyMembers,
  lifeEvents: patient.lifeEvents,
  countriesLived: patient.countriesLived,
  occupations: patient.occupations,
  favoritePlaces: patient.favoritePlaces,
  favoritePlacesText: patient.favoritePlacesText,
  festivalsCelebrated: patient.festivalsCelebrated,
  foodsPreferred: patient.foodsPreferred,
  preferredSports: patient.preferredSports,
  preferredSportsText: patient.preferredSportsText,
  languagesPreferred: patient.languagesPreferred,
  assignedCaregiverId: patient.assignedCaregiverId,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

const isSameObjectId = (left, right) => left?.toString() === right?.toString();

const canAccessPatientProfile = (requestingUser, patient) => {
  if (requestingUser.role === "patient") {
    return isSameObjectId(requestingUser.userId, patient._id);
  }

  if (requestingUser.role === "caregiver") {
    return isSameObjectId(requestingUser.userId, patient.assignedCaregiverId);
  }

  return false;
};

const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient id.",
      });
    }

    const patient = await User.findOne({ _id: patientId, role: "patient" })
      .select(patientProfileSelect);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    if (!canAccessPatientProfile(req.user, patient)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this patient profile.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient: toPatientProfile(patient),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient profile.",
      error: error.message,
    });
  }
};

const getAllPatientData = async (req, res) => {
  try {
    let query;

    if (req.user.role === "patient") {
      query = { _id: req.user.userId, role: "patient" };
    } else if (req.user.role === "caregiver") {
      query = { role: "patient", assignedCaregiverId: req.user.userId };
    } else {
      return res.status(403).json({
        success: false,
        message: "Only patients and linked caregivers can access patient data.",
      });
    }

    const patients = await User.find(query)
      .select(patientProfileSelect)
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: {
        patients: patients.map(toPatientProfile),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient data.",
      error: error.message,
    });
  }
};

const getAllPatients = async (req, res) => {
  return getAllPatientData(req, res);
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient id.",
      });
    }

    const patient = await User.findById(id).select(patientProfileSelect);

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    if (!canAccessPatientProfile(req.user, patient)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this patient profile.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient: toPatientProfile(patient),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getPatientProfile,
  getAllPatientData,
};
