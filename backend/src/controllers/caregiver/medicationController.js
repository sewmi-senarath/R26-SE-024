const Medication = require('../../models/caregiver/Medication');
const { createNotification } = require('../../controllers/caregiver/Notificationcontroller');


const parseTimeToToday = (timeStr) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/.exec((timeStr || '').trim());
  if (!match) return null;

  let [, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (meridiem) {
    meridiem = meridiem.toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  }

  const result = new Date();
  result.setHours(hour, minute, 0, 0);
  return result;
};

//  GET all medications for logged-in caregiver 
const getMedications = async (req, res) => {
  try {
    const caregiverId = req.user.userId;
    const medications = await Medication.find({ caregiverId }).sort({ createdAt: -1 });

 
    const now = Date.now();
    const GRACE_MS = 30 * 60 * 1000;

    for (const med of medications) {
      if (med.status !== 'pending') continue;
      const dueAt = parseTimeToToday(med.time);
      if (!dueAt) continue; 

      if (now - dueAt.getTime() > GRACE_MS) {
        med.status = 'missed';
        med.streak = 0;
        await med.save();

        await createNotification({
          caregiverId,
          patientName: med.patientName,
          message: `Missed ${med.name} (${med.dose}) - was due at ${med.time}.`,
          severity: 'warning',
          source: 'medication',
        });
      }
    }

    res.status(200).json({ success: true, medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE medication 
const createMedication = async (req, res) => {
  try {
    const caregiverId = req.user.userId;
    const {
      name, dose, form, notes, time, timeSlot,
      patientId, patientName, patientInitials, patientColor,
    } = req.body;

    if (!name || !dose || !time || !patientId || !patientName) {
      return res.status(400).json({
        success: false,
        message: 'name, dose, time, patientId and patientName are required',
      });
    }

    const medication = await Medication.create({
      name, dose,
      form:            form         || 'Tablet',
      notes:           notes        || '',
      time,
      timeSlot:        timeSlot     || 'morning',
      patientId,
      patientName,
      patientInitials: patientInitials || patientName.slice(0, 2).toUpperCase(),
      patientColor:    patientColor || '#4F8EF7',
      caregiverId,
      status: 'pending',
      streak: 0,
    });

    res.status(201).json({ success: true, medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── TOGGLE medication status ───────────────────────────────────────────────
const toggleMedicationStatus = async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      caregiverId: req.user.userId,
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    const statusCycle = { taken: 'pending', pending: 'taken', missed: 'taken' };
    medication.status = statusCycle[medication.status];
    if (medication.status === 'taken') medication.streak += 1;
    else medication.streak = 0;

    await medication.save();
    res.status(200).json({ success: true, medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE medication 
const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      caregiverId: req.user.userId,
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.status(200).json({ success: true, message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMedications, createMedication, toggleMedicationStatus, deleteMedication };