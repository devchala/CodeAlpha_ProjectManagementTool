const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const config = require("../config/env");

/**
 * Security headers. Helmet's default CSP already fits this app (no inline scripts,
 * data: avatars, inline style attributes), so we only tighten two directives.
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "frame-ancestors": ["'none'"],
      // Upgrading to https breaks plain-http localhost in some browsers, so only do it in production.
      "upgrade-insecure-requests": config.isProd ? [] : null,
    },
  },
  strictTransportSecurity: config.isProd,
});

/**
 * The frontend is served by this same server, so same-origin requests need no CORS at all.
 * Other origins are blocked unless listed in CORS_ORIGINS (comma separated).
 */
const corsMiddleware = cors({
  origin(origin, callback) {
    callback(null, !origin || config.corsOrigins.includes(origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
});

function limiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { message },
  });
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Per IP address. Counters live in memory: fine for one server instance (see SECURITY_UPGRADE.md).
const apiLimiter = limiter({ windowMs: 15 * MINUTE, limit: 600, message: "Too many requests. Please slow down and try again shortly." });
const loginLimiter = limiter({ windowMs: 15 * MINUTE, limit: 10, skipSuccessfulRequests: true, message: "Too many failed login attempts. Try again in 15 minutes." });
const registerLimiter = limiter({ windowMs: HOUR, limit: 10, message: "Too many accounts created from this network. Try again later." });
const emailLimiter = limiter({ windowMs: HOUR, limit: 10, message: "Too many email verification attempts. Try again later." });

module.exports = { securityHeaders, corsMiddleware, apiLimiter, loginLimiter, registerLimiter, emailLimiter };
