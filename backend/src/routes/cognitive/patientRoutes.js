const express = require("express");
const {
  getAllPatients,
  getPatientById,
} = require("../../controllers/cognitive/patientController");
const { protect } = require("../../middleware/auth");

const patientRoutes = express.Router();

// Get all patients
patientRoutes.get("/", protect, getAllPatients);

// Get patient by ID
patientRoutes.get("/:id", protect, getPatientById);

module.exports = patientRoutes;
