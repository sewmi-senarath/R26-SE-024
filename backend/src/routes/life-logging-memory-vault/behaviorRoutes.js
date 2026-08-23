const express = require('express');
const router = express.Router();
const behaviorController = require('../../controllers/life-logging-memory-vault/behaviorController');

router.get('/patterns', behaviorController.getBehavioralPatterns);
router.post('/routine', behaviorController.addRoutine);

module.exports = router;
