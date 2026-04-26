const Patient = require('../../models/caregiver/Patient');

// ── GET all patients ───────────────────────────────────────────────────────
const getPatients = async (req, res) => {
  try {
    const caregiverId = req.query.caregiverId;
    if (!caregiverId) {
      return res.status(400).json({ success: false, message: 'caregiverId is required' });
    }

    const patients = await Patient.find({ caregiverId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: patients.length, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET single patient ─────────────────────────────────────────────────────
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE patient ─────────────────────────────────────────────────────────
const createPatient = async (req, res) => {
  try {
    const {
      name, initials, age, condition, stage,
      avatarColor, emoji, condition_notes,
      condition_description, caregiverId,
    } = req.body;

    if (!name || !age || !condition || !stage || !caregiverId) {
      return res.status(400).json({
        success: false,
        message: 'name, age, condition, stage, and caregiverId are required',
      });
    }

    const patient = await Patient.create({
      name, initials, age, condition, stage,
      avatarColor:           avatarColor || '#4F8EF7',
      emoji:                 emoji || '🙂',
      lastChecked:           'Just now',
      condition_notes:       condition_notes || 'No notes added',
      condition_description: condition_description || 'No description provided.',
      routines:              [],
      caregiverId,
    });

    res.status(201).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE patient ─────────────────────────────────────────────────────────
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE patient ─────────────────────────────────────────────────────────
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADD routine to patient ─────────────────────────────────────────────────
const addRoutine = async (req, res) => {
  try {
    const { title, time } = req.body;
    if (!title || !time) {
      return res.status(400).json({ success: false, message: 'title and time are required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    patient.routines.push({ title, time, completed: false });
    await patient.save();

    res.status(201).json({
      success: true,
      routine: patient.routines[patient.routines.length - 1],
      patient,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── TOGGLE routine completed ───────────────────────────────────────────────
const toggleRoutine = async (req, res) => {
  try {
    const { id, routineId } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const routine = patient.routines.id(routineId);
    if (!routine) {
      return res.status(404).json({ success: false, message: 'Routine not found' });
    }

    routine.completed = !routine.completed;
    await patient.save();

    res.status(200).json({ success: true, routine, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE routine ─────────────────────────────────────────────────────────
const deleteRoutine = async (req, res) => {
  try {
    const { id, routineId } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    patient.routines = patient.routines.filter(
      (r) => r._id.toString() !== routineId
    );
    await patient.save();

    res.status(200).json({ success: true, message: 'Routine deleted', patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  addRoutine,
  toggleRoutine,
  deleteRoutine,
};