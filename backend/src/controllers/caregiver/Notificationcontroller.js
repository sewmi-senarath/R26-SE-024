const Notification = require('../../models/caregiver/Notification');


const createNotification = async ({
  caregiverId,
  patientName = 'System',
  message,
  severity = 'info',
  source = 'system',
}) => {
  try {
    return await Notification.create({ caregiverId, patientName, message, severity, source });
  } catch (error) {

    console.error('Failed to create notification:', error.message);
    return null;
  }
};

//  GET /api/caregiver/notifications 
const getNotifications = async (req, res) => {
  try {
    const caregiverId = req.user.userId;
    const notifications = await Notification.find({ caregiverId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/caregiver/notifications/:id/acknowledge 
const acknowledgeNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user.userId },
      { acknowledged: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/caregiver/notifications/acknowledge-all 
const acknowledgeAll = async (req, res) => {
  try {
    await Notification.updateMany(
      { caregiverId: req.user.userId, acknowledged: false },
      { acknowledged: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  acknowledgeNotification,
  acknowledgeAll,
  createNotification, 
};