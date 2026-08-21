const { success } = require("../../utils/responseFormatter");
const gameSessionService = require("../../services/cognitive/games/gameSessionService");
const { validateGameSessionPayload } = require("../../services/cognitive/games/gameValidationService");
const mongoose = require("mongoose");
const User = require("../../models/auth/User");

const isSameObjectId = (left, right) => left?.toString() === right?.toString();

async function canAccessPatientSessions(requestingUser, patientId) {
  if (requestingUser.role === "patient") {
    return isSameObjectId(requestingUser.userId, patientId);
  }

  if (requestingUser.role === "caregiver") {
    const patient = await User.findOne({ _id: patientId, role: "patient" })
      .select("assignedCaregiverId")
      .lean();
    return isSameObjectId(requestingUser.userId, patient?.assignedCaregiverId);
  }

  return false;
}

async function createSession(req, res, next) {
  try {
    validateGameSessionPayload(req.body);
    const session = await gameSessionService.createGameSession(req.body);
    return success(res, { session }, "Game session saved", 201);
  } catch (error) {
    return next(error);
  }
}

async function getPatientSessions(req, res, next) {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient id.",
      });
    }

    const allowed = await canAccessPatientSessions(req.user, patientId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this patient's game sessions.",
      });
    }

    const sessions = await gameSessionService.getGameSessionsForPatient(patientId);
    return success(res, { sessions }, "Game sessions fetched");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createSession,
  getPatientSessions,
};
