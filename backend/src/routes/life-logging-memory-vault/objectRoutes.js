const express = require('express');
const router = express.Router();
const objectController = require('../../controllers/life-logging-memory-vault/objectController');

router.post('/upsert', objectController.upsertObjectLocation);
router.get('/patient/:patientId', objectController.getPatientObjects);
router.post('/pi-camera/upload', objectController.upload.single('file'), objectController.piCameraUpload);
router.get('/', async (req, res) => res.json({ success: true, data: [] }));

module.exports = router;

