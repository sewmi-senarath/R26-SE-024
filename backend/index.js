require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./src/config/db");

const taskRoutes = require('./src/routes/caregiver/taskRoutes');
const patientRoutes = require('./src/routes/caregiver/patientRoutes');
const cognitiveRoutes = require('./src/routes/cognitive');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

connectDB();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Caregiver Portal routes ...
app.use('/api/caregiver/tasks', taskRoutes);
app.use('/api/caregiver/patients', patientRoutes);
// Cognitive Assessment routes
app.use('/api/cognitive', cognitiveRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT} : http://localhost:${PORT}`);
});
