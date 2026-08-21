const BehaviorLog = require('../models/BehaviorLog');
const Patient = require('../models/Patient');

// @desc    Bulk upload behavior logs
// @route   POST /api/admin/behavior/bulk
const bulkUploadBehavior = async (req, res) => {
  try {
    const logs = req.body; // Array of logs
    
    // Validate patient codes and map to IDs
    const enrichedLogs = [];
    for (const log of logs) {
      const patient = await Patient.findOne({ customerCode: log.patientCode });
      if (!patient) {
        return res.status(400).json({ 
          success: false, 
          message: `Patient with code ${log.patientCode} not found in registry.` 
        });
      }
      enrichedLogs.push({
        ...log,
        patientId: patient._id
      });
    }

    await BehaviorLog.insertMany(enrichedLogs);
    res.status(201).json({ 
      success: true, 
      message: `${enrichedLogs.length} behavior logs ingested successfully.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logs for a specific patient
// @route   GET /api/admin/behavior/:patientId
const getBehaviorLogs = async (req, res) => {
  try {
    const logs = await BehaviorLog.find({ patientId: req.params.patientId }).sort({ date: -1, time: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  bulkUploadBehavior,
  getBehaviorLogs
};
