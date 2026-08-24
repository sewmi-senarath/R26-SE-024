const Notification = require('../../models/caregiver/Notification');

// ── Internal helper — NOT an HTTP route ─────────────────────────────────────
// Call this directly from anywhere else in the backend (another controller,
// a route handler, etc.) whenever something real happens that a caregiver
// should be told about. This is how "real" notifications get created —
// there's no route for it because nothing outside the backend should be
// able to create a notification on someone else's behalf.
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
    // Deliberately does not throw — a failed notification should never break
    // the real feature that triggered it (e.g. a check-in submission should
    // still succeed even if raising the notification about it fails).
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

// ── GET /api/caregiver/notifications ────────────────────────────────────────
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

// ── PATCH /api/caregiver/notifications/:id/acknowledge ──────────────────────
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

// ── PATCH /api/caregiver/notifications/acknowledge-all ──────────────────────
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
  createNotification, // exported so other controllers can raise real notifications
};