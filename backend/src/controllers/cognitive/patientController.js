const User = require("../../models/auth/User");

// ── GET ALL PATIENTS ──────────────────────────────────────────────────────
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" })
      .select(
        "fullName email age gender preferredLanguage cognitiveLevel hometown hobbies interests " +
          "familyMembers lifeEvents countriesLived occupations " +
          "favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports preferredSportsText languagesPreferred assignedCaregiverId " +
          "createdAt updatedAt",
      )
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: {
        patients: patients.map((p) => ({
          id: p._id,
          fullName: p.fullName,
          email: p.email,
          age: p.age,
          gender: p.gender,
          preferredLanguage: p.preferredLanguage,
          cognitiveLevel: p.cognitiveLevel,
          hometown: p.hometown,
          hobbies: p.hobbies,
          interests: p.interests,
          familyMembers: p.familyMembers,
          lifeEvents: p.lifeEvents,
          countriesLived: p.countriesLived,
          occupations: p.occupations,
          favoritePlaces: p.favoritePlaces,
          favoritePlacesText: p.favoritePlacesText,
          festivalsCelebrated: p.festivalsCelebrated,
          foodsPreferred: p.foodsPreferred,
          preferredSports: p.preferredSports,
          preferredSportsText: p.preferredSportsText,
          languagesPreferred: p.languagesPreferred,
          assignedCaregiverId: p.assignedCaregiverId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patients.",
      error: error.message,
    });
  }
};

// ── GET PATIENT BY ID ─────────────────────────────────────────────────────
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await User.findById(id).select(
      "fullName email age gender preferredLanguage cognitiveLevel hometown hobbies interests " +
        "familyMembers lifeEvents countriesLived occupations " +
        "favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports preferredSportsText languagesPreferred assignedCaregiverId " +
        "createdAt updatedAt",
    );

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient: {
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
        },
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

module.exports = { getAllPatients, getPatientById };
