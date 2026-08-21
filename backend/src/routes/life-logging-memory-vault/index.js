const express = require('express');
const router = express.Router();

const ingestionRoutes = require('./ingestionRoutes');
const behaviorRoutes = require('./behaviorRoutes');
const objectRoutes = require('./objectRoutes');
const memoryRoutes = require('./memoryRoutes');

router.use('/ingestion', ingestionRoutes);
router.use('/behavior', behaviorRoutes);
router.use('/objects', objectRoutes);
router.use('/memories', memoryRoutes);

module.exports = router;
