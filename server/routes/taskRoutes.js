const router = require("express").Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
router.use(auth);
const mine = u => ({ $or: [{ owner: u }, { members: u }] });
const pop = q => q.populate("project", "name").populate("assignedTo", "name");
const popFull = q => q.populate({ path: "project", select: "name owner members", populate: { path: "owner members", select: "name email avatarVer" } }).populate("assignedTo", "name");
router.get("/", async (req, res) => {
  const ids = (await Project.find(mine(req.user.id)).select("_id")).map(p => p._id);
  const f = { project: { $in: ids } };
  if (req.query.project) f.project = ids.find(i => String(i) === req.query.project) || null;
  res.json(await pop(Task.find(f).sort("-createdAt")));
});
router.get("/:id", async (req, res) => {
  const t = await popFull(Task.findById(req.params.id));
  if (!t || !(await Project.exists({ _id: t.project._id, ...mine(req.user.id) }))) return res.status(404).json({ message: "Task not found." });
  res.json(t);
});
router.post("/:id/comments", async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t || !(await Project.exists({ _id: t.project, ...mine(req.user.id) }))) return res.status(404).json({ message: "Task not found." });
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).json({ message: "Write a comment first." });
  const u = await User.findById(req.user.id).select("name");
  t.comments.push({ user: u._id, name: u.name, text: text.slice(0, 1000) });
  await t.save();
  res.status(201).json(await pop(Task.findById(t._id)));
});
router.post("/", async (req, res) => {
  const { title, project, priority, dueDate, assignedTo } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Task title is required." });
  const pr = await Project.findOne({ _id: project, ...mine(req.user.id) });
  if (!pr) return res.status(403).json({ message: "Choose one of your projects." });
  if (assignedTo && ![pr.owner, ...pr.members].some(i => String(i) === assignedTo)) return res.status(400).json({ message: "The assignee must be a project member." });
  const t = await Task.create({ title, project, priority, dueDate: dueDate || undefined, assignedTo: assignedTo || undefined });
  res.status(201).json(await pop(Task.findById(t._id)));
});
router.put("/:id", async (req, res) => {
  const t = await Task.findById(req.params.id);
  const pr = t && (await Project.findOne({ _id: t.project, ...mine(req.user.id) }));
  if (!pr) return res.status(404).json({ message: "Task not found." });
  const u = await User.findById(req.user.id).select("name");
  if (req.body.assignedTo !== undefined) {
    const to = req.body.assignedTo || null;
    if (to && ![pr.owner, ...pr.members].some(i => String(i) === String(to))) return res.status(400).json({ message: "The assignee must be a project member." });
    if (String(t.assignedTo || "") !== String(to || "")) {
      const who = to && (await User.findById(to).select("name"));
      t.history.push({ text: who ? `${u.name} assigned this task to ${who.name}` : `${u.name} removed the assignee` });
      t.assignedTo = to || undefined;
    }
  }
  ["status", "priority"].forEach(k => req.body[k] !== undefined && req.body[k] !== t[k] && t.history.push({ text: `${u.name} changed ${k} from ${t[k]} to ${req.body[k]}` }));
  if (req.body.title?.trim() && req.body.title !== t.title) t.history.push({ text: `${u.name} renamed the task` });
  ["title", "status", "priority", "dueDate"].forEach(k => req.body[k] !== undefined && (t[k] = req.body[k] || undefined));
  if (req.body.description !== undefined) t.description = String(req.body.description).slice(0, 5000);
  if (Array.isArray(req.body.subtasks)) t.subtasks = req.body.subtasks.map(x => ({ title: String(x.title || "").trim().slice(0, 120), done: !!x.done })).filter(x => x.title).slice(0, 50);
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
