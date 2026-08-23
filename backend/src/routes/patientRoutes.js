const express = require('express');
const router = express.Router();
const {
  registerPatient,
  bulkUploadPatients,
  getAllPatients,
  getPatientByCode,
  getPatientById,
  updatePatient
} = require('../controllers/PatientController');

router.post('/', registerPatient);
router.post('/bulk', bulkUploadPatients);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.get('/code/:code', getPatientByCode);
router.put('/:id', updatePatient);

module.exports = router;
