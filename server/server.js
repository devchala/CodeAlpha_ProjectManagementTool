require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../client")));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "TaskFlow API is running" }));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/index.html")));
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));
app.use((err, req, res, next) => res.status(["CastError", "ValidationError"].includes(err.name) ? 400 : 500).json({ message: err.name === "CastError" ? "Invalid id." : err.message }));
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`TaskFlow server running on port ${PORT}`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}
startServer();
