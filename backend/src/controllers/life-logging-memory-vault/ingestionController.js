const dataService = require('../../services/life-logging-memory-vault/dataService');
const BehaviorLog = require('../../models/life-logging-memory-vault/BehaviorLog');

exports.uploadData = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const log = await dataService.processBulkData(
      req.file.path, 
      req.file.originalname, 
      req.file.size
    );
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIngestionHistory = async (req, res) => {
  try {
    const logs = await BehaviorLog.find().sort({ dateUploaded: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
