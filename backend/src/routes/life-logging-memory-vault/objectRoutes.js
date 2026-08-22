const express = require('express');
const router = express.Router();
const objectController = require('../../controllers/life-logging-memory-vault/objectController');

router.get('/', objectController.getTrackedObjects);
router.put('/:id', objectController.updateObjectLocation);

module.exports = router;
