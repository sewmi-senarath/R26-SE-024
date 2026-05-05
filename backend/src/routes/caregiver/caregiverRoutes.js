const express    = require('express');
const router     = express.Router();
const {
  getProfile,
  createCaregiver,
  updateProfile,
  updateStats,
  updateOnlineStatus,
  deleteCaregiver,
} = require('../../controllers/caregiver/caregiverController');

router.post('/',                       createCaregiver);
router.get('/:id',                     getProfile);
router.put('/:id',                     updateProfile);
router.patch('/:id/stats',             updateStats);
router.patch('/:id/online-status',     updateOnlineStatus);
router.delete('/:id',                  deleteCaregiver);

module.exports = router;