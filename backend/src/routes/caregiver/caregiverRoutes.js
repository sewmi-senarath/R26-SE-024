// const express    = require('express');
// const router     = express.Router();
// const {
//   getProfile,
//   createCaregiver,
//   updateProfile,
//   updateStats,
//   updateOnlineStatus,
//   deleteCaregiver,
// } = require('../../controllers/caregiver/caregiverController');

// router.post('/',                       createCaregiver);
// router.get('/:id',                     getProfile);
// router.put('/:id',                     updateProfile);
// router.patch('/:id/stats',             updateStats);
// router.patch('/:id/online-status',     updateOnlineStatus);
// router.delete('/:id',                  deleteCaregiver);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
  getProfile,
  createCaregiver,
  updateProfile,
  updateStats,
  updateOnlineStatus,
  deleteCaregiver,
} = require('../../controllers/caregiver/caregiverController');

router.post('/',                   createCaregiver);
router.get('/me',                  protect, authorize('caregiver'), getProfile);  // ✅ get own profile
router.get('/:id',                 protect, authorize('caregiver'), getProfile);
router.put('/:id',                 protect, authorize('caregiver'), updateProfile);
router.patch('/:id/stats',         protect, authorize('caregiver'), updateStats);
router.patch('/:id/online-status', protect, authorize('caregiver'), updateOnlineStatus);
router.delete('/:id',              protect, authorize('caregiver'), deleteCaregiver);

module.exports = router;