// A small Express app that mounts the REAL family/patient routes needed
// for close-the-loop tests, exactly like index.js does (same URLs).
// index.js itself is not modified or imported — mirrors the pattern
// already used in tests/caregiver/helpers/testApp.js.
const express = require('express');
const authRoutes = require('../../../src/routes/auth/authRoutes');
const familyEmotionRoutes = require('../../../src/routes/family/emotionRoutes');
const familyStoryQuizRoutes = require('../../../src/routes/family/storyQuizRoutes');
const familyMemoryRoutes = require('../../../src/routes/family/memoryRoutes');
const { notFoundHandler, errorHandler } = require('../../../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/family/emotion', familyEmotionRoutes);
app.use('/api/family/story-quiz', familyStoryQuizRoutes);
app.use('/api/family/memories', familyMemoryRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
