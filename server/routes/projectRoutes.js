const router = require("express").Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
router.use(auth);
const pop = q => q.populate("owner members", "name email");
router.get("/", async (req, res) => res.json(await pop(Project.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] }).sort("-createdAt"))));
router.post("/", async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: "Project name is required." });
  const p = await Project.create({ name: req.body.name, description: req.body.description, owner: req.user.id });
  res.status(201).json(await pop(Project.findById(p._id)));
});
router.post("/:id/members", async (req, res) => {
  const p = await Project.findOne({ _id: req.params.id, owner: req.user.id });
  if (!p) return res.status(404).json({ message: "Project not found, or you are not the owner." });
  const u = await User.findOne({ email: (req.body.email || "").toLowerCase() });
  if (!u) return res.status(404).json({ message: "No user with that email. Ask them to register first." });
  await Project.updateOne({ _id: p._id }, { $addToSet: { members: u._id } });
  res.json(await pop(Project.findById(p._id)));
});
router.delete("/:id", async (req, res) => {
  const p = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!p) return res.status(404).json({ message: "Project not found, or you are not the owner." });
  await Task.deleteMany({ project: p._id });
  res.json({ message: "Project deleted." });
});
module.exports = router;
