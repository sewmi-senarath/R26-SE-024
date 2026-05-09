const express = require("express");
const { getQuestions } = require("../../controllers/cognitive/questionController");

const questionRoutes = express.Router();

questionRoutes.get("/", getQuestions);

module.exports = questionRoutes;