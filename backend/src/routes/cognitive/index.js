const express = require("express");
const questionRoutes = require("./questionRoutes");
const assessmentRoutes = require("./assessmentRoutes");
const gameRoutes = require("./gameSessionRoutes");
const patientRoutes = require("./patientRoutes");
const dementiaPredictionRoutes = require("./dementiaPredictionRoutes");

const router = express.Router();

router.use("/questions", questionRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/games", gameRoutes);
router.use("/patients", patientRoutes);
router.use("/dementia", dementiaPredictionRoutes);

module.exports = router;
