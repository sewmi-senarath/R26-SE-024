const express = require("express");
const { createSession } = require("../../controllers/cognitive/gameSessionController");

const gameRoutes = express.Router();

gameRoutes.post("/sessions", createSession);

module.exports = gameRoutes;
