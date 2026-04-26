const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
} = require('../../controllers/caregiver/taskController');

// /api/caregiver/tasks
router.get('/',        getTasks);
router.post('/',       createTask);
router.get('/:id',     getTaskById);
router.put('/:id',     updateTask);
router.patch('/:id/toggle', toggleTaskStatus);
router.delete('/:id',  deleteTask);

module.exports = router;