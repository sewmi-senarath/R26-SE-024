const { success } = require("../../utils/responseFormatter");
const gameSessionService = require("../../services/cognitive/games/gameSessionService");
const gameProgressService = require("../../services/cognitive/games/gameProgressService");
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

    // Adapt the difficulty from this session's performance. Bookkeeping must
    // never sink the save - if it fails we still return the saved session with
    // a null progress update, and the client simply shows no change banner.
    let progress = null;
    try {
      progress = await gameProgressService.recordSessionAndAdapt(req.body);
    } catch (progressError) {
      console.warn(
        "[game-progress] Failed to adapt difficulty for session:",
        progressError.message,
      );
    }

    return success(res, { session, progress }, "Game session saved", 201);
  } catch (error) {
    return next(error);
  }
}

async function getPatientProgress(req, res, next) {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }

    const allowed = await canAccessPatientSessions(req.user, patientId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this patient's progress.",
      });
    }

    const progress = await gameProgressService.getProgressForPatient(patientId);
    return success(res, { progress }, "Game progress fetched");
  } catch (error) {
    return next(error);
  }
}

async function getPatientDifficultyReport(req, res, next) {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }

    const allowed = await canAccessPatientSessions(req.user, patientId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this patient's report.",
      });
    }

    const report = await gameProgressService.getDifficultyReport(patientId);
    return success(res, { report }, "Difficulty report fetched");
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
  getPatientProgress,
  getPatientDifficultyReport,
};
