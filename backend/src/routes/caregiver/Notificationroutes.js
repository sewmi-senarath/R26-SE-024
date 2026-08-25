const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  getNotifications,
  acknowledgeNotification,
  acknowledgeAll,
} = require('../../controllers/caregiver/Notificationcontroller');

router.get('/',                    protect, authorize('caregiver'), getNotifications);
router.patch('/:id/acknowledge',   protect, authorize('caregiver'), acknowledgeNotification);
router.patch('/acknowledge-all',   protect, authorize('caregiver'), acknowledgeAll);

module.exports = router;