const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
} = require('../../controllers/caregiver/taskController');

// ✅ All routes protected - only caregivers
router.get('/',              protect, authorize('caregiver'), getTasks);
router.post('/',             protect, authorize('caregiver'), createTask);
router.get('/:id',           protect, authorize('caregiver'), getTaskById);
router.put('/:id',           protect, authorize('caregiver'), updateTask);
router.patch('/:id/toggle',  protect, authorize('caregiver'), toggleTaskStatus);
router.delete('/:id',        protect, authorize('caregiver'), deleteTask);

module.exports = router;