require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./src/config/db");
const taskRoutes = require('./src/routes/caregiver/taskRoutes');

connectDB();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Caregiver Portal routes ...
app.use('/api/caregiver/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT} : http://localhost:${PORT}`);
});
