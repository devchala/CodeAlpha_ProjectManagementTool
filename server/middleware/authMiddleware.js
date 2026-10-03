const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  const token = (req.headers.authorization || "").split(" ")[1];
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: "Please log in again." }); }
};
