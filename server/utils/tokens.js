const crypto = require("crypto");

/** Random, unguessable token that is sent to the user (e.g. in an email link). */
const generateToken = () => crypto.randomBytes(32).toString("hex");

/** Only the SHA-256 hash is stored in the database, so a DB leak does not leak usable links. */
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { generateToken, hashToken };
