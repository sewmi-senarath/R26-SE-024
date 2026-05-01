const express = require("express");
const questionRoutes = require("./questionRoutes");
const assessmentRoutes = require("./assessmentRoutes");

const router = express.Router();

router.use("/questions", questionRoutes);
router.use("/assessments", assessmentRoutes);

module.exports = router;