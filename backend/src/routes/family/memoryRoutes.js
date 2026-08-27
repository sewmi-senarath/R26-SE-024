const express = require('express');
const router  = express.Router();

const {
  createMemory,
  getMemoriesByPatient,
  getMemoryById,
  incrementPlayCount,
   deleteMemory,
} = require('../../controllers/family/memoryController');

router.post('/', createMemory);
router.get('/patient/:patientId', getMemoriesByPatient);
router.get('/:id', getMemoryById);
router.patch('/:id/play', incrementPlayCount);
router.delete('/:id', deleteMemory);

module.exports = router;