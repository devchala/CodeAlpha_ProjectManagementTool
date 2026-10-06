/**
 * Rate limiting (free, in-memory, per server process).
 *
 * Limits are counted per IP address, except the two limiters that run after login
 * (invites, profile), which are counted per user. Every number below can be changed
 * with an environment variable in server/.env, for example:
 *   RATE_LIMIT_LOGIN_MAX=3          RATE_LIMIT_LOGIN_WINDOW_MIN=0.5
 * Set RATE_LIMIT_ENABLED=false to switch everything off while developing.
 */
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const num = (name, fallback) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const waitText = ms => {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return s < 90 ? `${s} second${s === 1 ? "" : "s"}` : `${Math.ceil(s / 60)} minutes`;
};

function limiter(name, { max, windowMin, message, byUser = false, ...options }) {
  return rateLimit({
    windowMs: num(`RATE_LIMIT_${name}_WINDOW_MIN`, windowMin) * 60 * 1000,
    limit: num(`RATE_LIMIT_${name}_MAX`, max),
    standardHeaders: "draft-7", // RateLimit and Retry-After headers
    legacyHeaders: false,
    skip: () => process.env.RATE_LIMIT_ENABLED === "false",
    keyGenerator: byUser ? req => req.user?.id ?? ipKeyGenerator(req.ip) : undefined,
    // Same { message } shape as every other API error, so the UI shows it automatically.
    handler: (req, res) => res.status(429).json({ message: `${message} Try again in ${waitText(req.rateLimit.resetTime - Date.now())}.` }),
    ...options
  });
}

module.exports = {
  // Every /api request. Generous: normal use and development never come close.
  apiLimiter: limiter("API", { max: 600, windowMin: 15, message: "Too many requests." }),
  // Only failed logins count, so brute-force guessing is stopped but normal logins are not.
  loginLimiter: limiter("LOGIN", { max: 10, windowMin: 15, skipSuccessfulRequests: true, message: "Too many failed login attempts." }),
  registerLimiter: limiter("REGISTER", { max: 10, windowMin: 60, message: "Too many sign-up attempts." }),
  inviteLimiter: limiter("INVITE", { max: 20, windowMin: 60, byUser: true, message: "You have sent too many invitations." }),
  profileLimiter: limiter("PROFILE", { max: 20, windowMin: 60, byUser: true, message: "Too many profile updates." })
};
