const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: Date,
  subtasks: [{ title: String, done: { type: Boolean, default: false } }],
  comments: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, name: String, text: String, at: { type: Date, default: Date.now } }],
  history: [{ text: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });
module.exports = mongoose.model("Task", taskSchema);
