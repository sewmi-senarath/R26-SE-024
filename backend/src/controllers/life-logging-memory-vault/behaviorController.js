const Routine = require('../../models/life-logging-memory-vault/Routine');

exports.getBehavioralPatterns = async (req, res) => {
  try {
    const patterns = await Routine.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addRoutine = async (req, res) => {
  try {
    const routine = new Routine(req.body);
    await routine.save();
    res.status(201).json({ success: true, data: routine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
