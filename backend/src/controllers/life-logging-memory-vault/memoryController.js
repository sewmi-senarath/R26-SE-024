const Memory = require('../../models/life-logging-memory-vault/Memory');

exports.getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ lastInteracted: -1 });
    res.status(200).json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMemory = async (req, res) => {
  try {
    const memory = new Memory({
      ...req.body,
      imageUrl: req.file ? req.file.path : req.body.imageUrl
    });
    await memory.save();
    res.status(201).json({ success: true, data: memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
