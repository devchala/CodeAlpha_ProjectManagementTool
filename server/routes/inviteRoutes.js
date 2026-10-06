const router = require("express").Router();
const Project = require("../models/Project");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const auth = require("../middleware/authMiddleware");
router.use(auth);
const myEmail = async id => (await User.findById(id).select("email"))?.email;
const pending = async req => Invitation.findOne({ _id: req.params.id, email: await myEmail(req.user.id), status: "pending" });
router.get("/", async (req, res) => {
  const list = await Invitation.find({ email: await myEmail(req.user.id), status: "pending" }).sort("-createdAt").populate("project", "name").populate("invitedBy", "name");
  res.json(list.filter(i => i.project));
});
router.post("/:id/accept", async (req, res) => {
  const inv = await pending(req);
  if (!inv) return res.status(404).json({ message: "Invitation not found or already answered." });
  const p = await Project.findById(inv.project);
  if (!p) { await inv.deleteOne(); return res.status(404).json({ message: "That project no longer exists." }); }
  await Project.updateOne({ _id: p._id }, { $addToSet: { members: req.user.id } });
  inv.status = "accepted"; await inv.save();
  res.json({ message: `You joined ${p.name}.`, project: p._id });
});
router.post("/:id/decline", async (req, res) => {
  const inv = await pending(req);
  if (!inv) return res.status(404).json({ message: "Invitation not found or already answered." });
  inv.status = "declined"; await inv.save();
  res.json({ message: "Invitation declined." });
});
module.exports = router;
