// const Task = require('../../models/caregiver/Task');

// // ── GET all tasks (optionally filter by date) ──────────────────────────────
// const getTasks = async (req, res) => {
//   try {
//     const { date } = req.query;
//     const caregiverId = req.user?.id || req.body.caregiverId; // adjust when auth is ready

//     const filter = { caregiverId };
//     if (date) filter.date = date;

//     const tasks = await Task.find(filter).sort({ createdAt: -1 });

//     const counts = {
//       all:  tasks.length,
//       todo: tasks.filter((t) => t.status === 'todo').length,
//       done: tasks.filter((t) => t.status === 'done').length,
//     };

//     res.status(200).json({
//       success: true,
//       counts,
//       tasks,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── GET single task ────────────────────────────────────────────────────────
// const getTaskById = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) {
//       return res.status(404).json({ success: false, message: 'Task not found' });
//     }
//     res.status(200).json({ success: true, task });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── CREATE task ────────────────────────────────────────────────────────────
// const createTask = async (req, res) => {
//   try {
//     const {
//       title, patientName, patientInitials, patientColor,
//       time, priority, category, assignee, date, caregiverId,
//     } = req.body;

//     if (!title || !patientName || !patientInitials || !time || !date || !caregiverId) {
//       return res.status(400).json({
//         success: false,
//         message: 'title, patientName, patientInitials, time, date, and caregiverId are required',
//       });
//     }

//     const task = await Task.create({
//       title, patientName, patientInitials,
//       patientColor: patientColor || '#4F8EF7',
//       time, priority, category,
//       assignee: assignee || 'SJ',
//       date, caregiverId,
//     });

//     res.status(201).json({ success: true, task });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── UPDATE task (full update) ──────────────────────────────────────────────
// const updateTask = async (req, res) => {
//   try {
//     const task = await Task.findByIdAndUpdate(
//       req.params.id,
//       { ...req.body },
//       { new: true, runValidators: true }
//     );
//     if (!task) {
//       return res.status(404).json({ success: false, message: 'Task not found' });
//     }
//     res.status(200).json({ success: true, task });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── TOGGLE status (todo ↔ done) ────────────────────────────────────────────
// const toggleTaskStatus = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) {
//       return res.status(404).json({ success: false, message: 'Task not found' });
//     }

//     task.status = task.status === 'done' ? 'todo' : 'done';
//     await task.save();

//     res.status(200).json({ success: true, task });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── DELETE task ────────────────────────────────────────────────────────────
// const deleteTask = async (req, res) => {
//   try {
//     const task = await Task.findByIdAndDelete(req.params.id);
//     if (!task) {
//       return res.status(404).json({ success: false, message: 'Task not found' });
//     }
//     res.status(200).json({ success: true, message: 'Task deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   getTasks,
//   getTaskById,
//   createTask,
//   updateTask,
//   toggleTaskStatus,
//   deleteTask,
// };

const Task = require('../../models/caregiver/Task');

// ── GET all tasks ──────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const { date } = req.query;

    // ✅ Use JWT user ID - not query param
    const caregiverId = req.user.userId;

    const filter = { caregiverId };
    if (date) filter.date = date;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    const counts = {
      all:  tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };

    res.status(200).json({ success: true, counts, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET single task ────────────────────────────────────────────────────────
const getTaskById = async (req, res) => {
  try {
    // ✅ Only get task if it belongs to this caregiver
    const task = await Task.findOne({
      _id: req.params.id,
      caregiverId: req.user.userId,
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE task ────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const {
      title, patientName, patientInitials, patientColor,
      time, priority, category, assignee, date,
    } = req.body;

    if (!title || !patientName || !patientInitials || !time || !date) {
      return res.status(400).json({
        success: false,
        message: 'title, patientName, patientInitials, time and date are required',
      });
    }

    const task = await Task.create({
      title, patientName, patientInitials,
      patientColor: patientColor || '#4F8EF7',
      time, priority, category,
      assignee: assignee || 'SJ',
      date,
      // ✅ Auto-set caregiverId from JWT token
      caregiverId: req.user.userId,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE task ────────────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    // ✅ Only update if task belongs to this caregiver
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user.userId },
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── TOGGLE status ──────────────────────────────────────────────────────────
const toggleTaskStatus = async (req, res) => {
  try {
    // ✅ Only toggle if task belongs to this caregiver
    const task = await Task.findOne({
      _id: req.params.id,
      caregiverId: req.user.userId,
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = task.status === 'done' ? 'todo' : 'done';
    await task.save();

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE task ────────────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    // ✅ Only delete if task belongs to this caregiver
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      caregiverId: req.user.userId,
    });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
};