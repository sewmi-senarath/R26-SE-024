require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");

const taskRoutes = require('./src/routes/caregiver/taskRoutes');
const patientRoutes = require('./src/routes/caregiver/patientRoutes');
const lifeLoggingRoutes = require('./src/routes/life-logging-memory-vault');
const adminPatientRoutes = require('./src/routes/patientRoutes');
const behaviorRoutes = require('./src/routes/behaviorRoutes');
const personalObjectRoutes = require('./src/routes/personalObjectRoutes');

connectDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use(cors());

// Training Progress Simulation Endpoint
app.post('/api/admin/train/:patientId', (req, res) => {
  const { patientId } = req.params;
  let percentage = 0;
  
  const interval = setInterval(() => {
    percentage += Math.floor(Math.random() * 15) + 5;
    if (percentage >= 100) {
      percentage = 100;
      io.emit('training_progress', { patientId, percentage });
      clearInterval(interval);
    } else {
      io.emit('training_progress', { patientId, percentage });
    }
  }, 1000);

  res.json({ success: true, message: "Training started" });
});

// Routes
app.use('/api/caregiver/tasks', taskRoutes);
app.use('/api/caregiver/patients', patientRoutes);
app.use('/api/life-logging', lifeLoggingRoutes);
app.use('/api/admin/patients', adminPatientRoutes);
app.use('/api/admin/behavior', behaviorRoutes);
app.use('/api/admin/personal-objects', personalObjectRoutes);

io.on("connection", (socket) => {
  console.log("MemoCare Client Connected:", socket.id);
  socket.on("disconnect", () => console.log("Client Disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`EchoCare Backend: Running on PORT ${PORT}`);
});
