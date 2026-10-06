/**
 * One-time migration: accounts created BEFORE email verification existed have no
 * `emailVerified` flag. Run this once so those users are not locked out of invitations:
 *
 *   npm run verify-existing-users
 */
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

(async () => {
  try {
    await connectDB();
    const result = await User.updateMany({ emailVerified: { $ne: true } }, { $set: { emailVerified: true } });
    console.log(`Marked ${result.modifiedCount} existing user(s) as verified.`);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
