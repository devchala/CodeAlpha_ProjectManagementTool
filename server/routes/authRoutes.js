const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const { loginLimiter, registerLimiter, profileLimiter } = require("../middleware/rateLimiter");
const send = (res, u, code = 200) => res.status(code).json({
  token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
  user: { id: u._id, name: u.name, email: u.email, avatarVer: u.avatarVer }
});
router.post("/register", registerLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) return res.status(400).json({ message: "Password needs 8+ characters with uppercase, lowercase, a number and a symbol." });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: "This email is already registered." });
  send(res, await User.create({ name, email, password: await bcrypt.hash(password, 10) }), 201);
});
router.post("/login", loginLimiter, async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || "").toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || "", u.password))) return res.status(401).json({ message: "Wrong email or password." });
  send(res, u);
});
router.get("/me", auth, async (req, res) => res.json(await User.findById(req.user.id).select("-password")));
const AVATAR = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const validImage = (type, b) => type === "jpeg" ? b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff : type === "png" ? b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) : b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP";
router.put("/me", auth, profileLimiter, async (req, res) => {
  const $set = {}, $unset = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim().slice(0, 60);
    if (!name) return res.status(400).json({ message: "Name is required." });
    $set.name = name;
  }
  if (req.body.avatar === null) { $unset.avatar = 1; $unset.avatarVer = 1; }
  else if (req.body.avatar !== undefined) {
    const m = AVATAR.exec(String(req.body.avatar));
    if (!m || String(req.body.avatar).length > 140000) return res.status(400).json({ message: "Use a PNG, JPG or WebP image under about 100 KB." });
    if (!validImage(m[1], Buffer.from(m[2], "base64"))) return res.status(400).json({ message: "That file is not a valid image." });
    $set.avatar = req.body.avatar; $set.avatarVer = new Date();
  }
  const update = {}; if (Object.keys($set).length) update.$set = $set; if (Object.keys($unset).length) update.$unset = $unset;
  if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update." });
  await User.updateOne({ _id: req.user.id }, update);
  res.json(await User.findById(req.user.id).select("-password"));
});
router.get("/avatar/:id", async (req, res) => {
  const u = await User.findById(req.params.id).select("+avatar");
  const m = u?.avatar && AVATAR.exec(u.avatar);
  if (!m) return res.status(404).end();
  res.set({ "Content-Type": "image/" + m[1], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
  res.send(Buffer.from(m[2], "base64"));
});
module.exports = router;
