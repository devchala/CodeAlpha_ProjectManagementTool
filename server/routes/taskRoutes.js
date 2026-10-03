const router = require("express").Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");
router.use(auth);
const mine = u => ({ $or: [{ owner: u }, { members: u }] });
const pop = q => q.populate("project", "name").populate("assignedTo", "name");
router.get("/", async (req, res) => {
  const ids = (await Project.find(mine(req.user.id)).select("_id")).map(p => p._id);
  const f = { project: { $in: ids } };
  if (req.query.project) f.project = ids.find(i => String(i) === req.query.project) || null;
  res.json(await pop(Task.find(f).sort("-createdAt")));
});
router.post("/", async (req, res) => {
  const { title, project, priority, dueDate } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Task title is required." });
  if (!(await Project.exists({ _id: project, ...mine(req.user.id) }))) return res.status(403).json({ message: "Choose one of your projects." });
  const t = await Task.create({ title, project, priority, dueDate: dueDate || undefined });
  res.status(201).json(await pop(Task.findById(t._id)));
});
router.put("/:id", async (req, res) => {
  const t = await Task.findById(req.params.id);
  const ok = t && (await Project.exists({ _id: t.project, ...mine(req.user.id) }));
  if (!ok) return res.status(404).json({ message: "Task not found." });
  ["title", "status", "priority", "dueDate"].forEach(k => req.body[k] !== undefined && (t[k] = req.body[k] || undefined));
  await t.save();
  res.json(await pop(Task.findById(t._id)));
});
router.delete("/:id", async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t || !(await Project.exists({ _id: t.project, ...mine(req.user.id) }))) return res.status(404).json({ message: "Task not found." });
  await t.deleteOne();
  res.json({ message: "Task deleted." });
});
module.exports = router;
