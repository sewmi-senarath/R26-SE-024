const TrackedObject = require('../../models/life-logging-memory-vault/TrackedObject');

exports.getTrackedObjects = async (req, res) => {
  try {
    const objects = await TrackedObject.find();
    res.status(200).json({ success: true, data: objects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateObjectLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const object = await TrackedObject.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: object });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
