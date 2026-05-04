const express = require("express");
const { getQuestions } = require("../../controllers/cognitive/questionController");

const router = express.Router();

router.get("/", getQuestions);

module.exports = router;