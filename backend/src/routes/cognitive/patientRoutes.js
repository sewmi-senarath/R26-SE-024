const express = require("express");
const {
  getAllPatients,
  getPatientById,
  getPatientProfile,
  getAllPatientData,
} = require("../../controllers/cognitive/patientController");
const { protect } = require("../../middleware/auth");

const patientRoutes = express.Router();

// Get all patient profile data visible to the authenticated user
patientRoutes.get("/", protect, getAllPatientData);

// Get a protected personalization profile for one patient
patientRoutes.get("/:patientId/profile", protect, getPatientProfile);

// Get all patients
patientRoutes.get("/all", protect, getAllPatients);

module.exports = patientRoutes;
