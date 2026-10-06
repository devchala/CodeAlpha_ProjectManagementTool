const router = require("express").Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const auth = require("../middleware/authMiddleware");
const { inviteLimiter } = require("../middleware/rateLimiter");
router.use(auth);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pop = q => q.populate("owner members", "name email avatarVer");
const owned = (id, user) => Project.findOne({ _id: id, owner: user });
const NOT_OWNER = { message: "Project not found, or you are not the owner." };
router.get("/", async (req, res) => res.json(await pop(Project.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] }).sort("-createdAt"))));
router.post("/", async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: "Project name is required." });
  const p = await Project.create({ name: req.body.name, description: req.body.description, owner: req.user.id });
  res.status(201).json(await pop(Project.findById(p._id)));
});
router.get("/:id/invites", async (req, res) => {
  const p = await owned(req.params.id, req.user.id);
  if (!p) return res.status(404).json(NOT_OWNER);
  res.json(await Invitation.find({ project: p._id, status: "pending" }).sort("-createdAt"));
});
router.post("/:id/invites", inviteLimiter, async (req, res) => {
  const p = await owned(req.params.id, req.user.id);
  if (!p) return res.status(404).json(NOT_OWNER);
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  const target = await User.findOne({ email });
  if (target && [p.owner, ...p.members].some(i => String(i) === String(target._id))) return res.status(409).json({ message: "That person is already on this project." });
  if (await Invitation.findOne({ project: p._id, email, status: "pending" })) return res.status(409).json({ message: "An invitation is already pending for that email." });
  const invite = await Invitation.create({ project: p._id, email, invitedBy: req.user.id });
  res.status(201).json({ invite, registered: !!target });
});
router.delete("/:id/invites/:inviteId", async (req, res) => {
  const p = await owned(req.params.id, req.user.id);
  if (!p) return res.status(404).json(NOT_OWNER);
  const inv = await Invitation.findOneAndDelete({ _id: req.params.inviteId, project: p._id, status: "pending" });
  if (!inv) return res.status(404).json({ message: "Invitation not found." });
  res.json({ message: "Invitation revoked." });
});
router.delete("/:id/members/:userId", async (req, res) => {
  const p = await Project.findById(req.params.id);
  const involved = p && [p.owner, ...p.members].some(i => String(i) === req.user.id);
  if (!involved) return res.status(404).json({ message: "Project not found." });
  const self = req.params.userId === req.user.id;
  if (!self && String(p.owner) !== req.user.id) return res.status(403).json({ message: "Only the owner can remove members." });
  if (String(p.owner) === req.params.userId) return res.status(400).json({ message: "The owner cannot be removed. Delete the project instead." });
  if (!p.members.some(i => String(i) === req.params.userId)) return res.status(404).json({ message: "That person is not a member." });
  await Project.updateOne({ _id: p._id }, { $pull: { members: req.params.userId } });
  await Task.updateMany({ project: p._id, assignedTo: req.params.userId }, { $unset: { assignedTo: 1 } });
  res.json({ message: self ? "You left the project." : "Member removed." });
});
router.delete("/:id", async (req, res) => {
  const p = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!p) return res.status(404).json(NOT_OWNER);
  await Task.deleteMany({ project: p._id });
  await Invitation.deleteMany({ project: p._id });
  res.json({ message: "Project deleted." });
});
module.exports = router;
