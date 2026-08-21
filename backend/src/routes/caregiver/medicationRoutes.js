const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  getMedications,
  createMedication,
  toggleMedicationStatus,
  deleteMedication,
} = require('../../controllers/caregiver/medicationController');

router.get('/',              protect, authorize('caregiver'), getMedications);
router.post('/',             protect, authorize('caregiver'), createMedication);
router.patch('/:id/toggle',  protect, authorize('caregiver'), toggleMedicationStatus);
router.delete('/:id',        protect, authorize('caregiver'), deleteMedication);

module.exports = router;