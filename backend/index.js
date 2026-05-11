require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./src/config/db");
const medicationRoutes = require("./src/routes/caregiver/medicationRoutes");

const taskRoutes = require("./src/routes/caregiver/taskRoutes");
const patientRoutes = require("./src/routes/caregiver/patientRoutes");
const caregiverRoutes = require("./src/routes/caregiver/caregiverRoutes");
const cognitiveRoutes = require("./src/routes/cognitive");
const gameRoutes = require("./src/routes/cognitive/gameSessionRoutes");
const {
  notFoundHandler,
  errorHandler,
} = require("./src/middleware/errorHandler");
const insightRoutes = require("./src/routes/caregiver/insightRoutes");
const protectedRoutes = require("./src/routes/auth/protectedRoutes");
const authRoutes = require("./src/routes/auth/authRoutes");
const cognitivePatientRoutes = require("./src/routes/cognitive/patientRoutes");

connectDB();
const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/api/auth", authRoutes);

// Caregiver Portal routes ...
app.use("/api/caregiver/tasks", taskRoutes);
app.use("/api/caregiver/patients", patientRoutes);
app.use("/api/caregiver/profile", caregiverRoutes);
app.use("/api/caregiver/insights", insightRoutes);
app.use("/api/caregiver/medications", medicationRoutes);

// Cognitive Assessment routes
app.use("/api/cognitive", cognitiveRoutes);

app.use("/api", protectedRoutes);
app.use("/api/patients", cognitivePatientRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "MemoCare API is running ✅" });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT} : http://localhost:${PORT}`);
});
