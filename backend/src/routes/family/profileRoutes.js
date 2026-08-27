const express = require('express');
const router = express.Router();

const { upsertFamilyProfile, getFamilyProfile } = require('../../controllers/family/profileController');

router.put('/:patientId', upsertFamilyProfile);
router.get('/:patientId', getFamilyProfile);

module.exports = router;