const express = require('express');
const router = express.Router();
const { upload } = require('../../services/life-logging-memory-vault/cloudinaryService');
const memoryController = require('../../controllers/life-logging-memory-vault/memoryController');

router.get('/', memoryController.getMemories);
router.post('/', upload.single('image'), memoryController.addMemory);

module.exports = router;
