require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const subjectRoutes = require("./routes/subjects");
const sessionRoutes = require("./routes/sessions");
const timetableRoutes = require("./routes/timetable");
const revisionRoutes = require("./routes/revision");
const rewardsRoutes = require("./routes/rewards");
const streakRoutes = require("./routes/streak");
const progressRoutes = require("./routes/progress");
const practiceRoutes = require("./routes/practice");

// multer needs this folder to exist before any upload happens
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/revision", revisionRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/practice", practiceRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
  console.error(err);
});
