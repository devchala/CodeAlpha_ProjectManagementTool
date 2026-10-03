const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const send = (res, u, code = 200) => res.status(code).json({
  token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
  user: { id: u._id, name: u.name, email: u.email }
});
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) return res.status(400).json({ message: "Password needs 8+ characters with uppercase, lowercase, a number and a symbol." });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: "This email is already registered." });
  send(res, await User.create({ name, email, password: await bcrypt.hash(password, 10) }), 201);
});
router.post("/login", async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || "").toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || "", u.password))) return res.status(401).json({ message: "Wrong email or password." });
  send(res, u);
});
router.get("/me", auth, async (req, res) => res.json(await User.findById(req.user.id).select("-password")));
module.exports = router;
