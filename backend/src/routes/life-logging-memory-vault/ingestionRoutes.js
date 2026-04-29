const express = require('express');
const router = express.Router();
const multer = require('multer');
const ingestionController = require('../../controllers/life-logging-memory-vault/ingestionController');

const upload = multer({ dest: 'uploads/' }); // Temp local storage for CSVs

router.post('/upload', upload.single('file'), ingestionController.uploadData);
router.get('/history', ingestionController.getIngestionHistory);

module.exports = router;
