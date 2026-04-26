const express = require('express');
const router  = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addRoutine,
  toggleRoutine,
  deleteRoutine,
} = require('../../controllers/caregiver/patientController');

// Patient routes
router.get('/',    getPatients);
router.post('/',   createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Routine routes (nested under patient)
router.post('/:id/routines',                    addRoutine);
router.patch('/:id/routines/:routineId/toggle', toggleRoutine);
router.delete('/:id/routines/:routineId',       deleteRoutine);

module.exports = router;