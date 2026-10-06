/**
 * Central, validated configuration.
 *
 * Every other file reads settings from here instead of touching process.env,
 * so a missing or unsafe value stops the server at boot with a clear message
 * instead of failing later in a confusing way.
 */
require("dotenv").config();

const PLACEHOLDER_SECRET = /^(change_this|your_|secret|password|jwt)/i;

function toBool(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function toList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function buildConfig(env = process.env) {
  const errors = [];

  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const port = Number(env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push("PORT must be a valid port number.");

  const mongoUri = (env.MONGO_URI || "").trim();
  if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) errors.push("MONGO_URI must be set to a mongodb:// or mongodb+srv:// connection string.");

  const jwtSecret = env.JWT_SECRET || "";
  if (jwtSecret.length < 32 || PLACEHOLDER_SECRET.test(jwtSecret)) {
    errors.push(
      "JWT_SECRET must be a random string of at least 32 characters (not the example value). " +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  const appUrl = (env.APP_URL || `http://localhost:${port}`).trim().replace(/\/$/, "");
  const requireEmailVerification = toBool(env.REQUIRE_EMAIL_VERIFICATION, true);

  const smtp = env.SMTP_HOST
    ? {
        host: env.SMTP_HOST.trim(),
        port: Number(env.SMTP_PORT || 587),
        secure: toBool(env.SMTP_SECURE, Number(env.SMTP_PORT) === 465),
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASS || "",
        from: env.SMTP_FROM || `TaskFlow <no-reply@${new URL(appUrl).hostname}>`,
      }
    : null;

  if (isProd && requireEmailVerification) {
    if (!smtp) errors.push("SMTP_HOST (and related SMTP_* values) are required in production while REQUIRE_EMAIL_VERIFICATION is on.");
    if (!env.APP_URL) errors.push("APP_URL is required in production so verification links point to your real site.");
  }

  if (errors.length) {
    throw new Error("Invalid environment configuration:\n - " + errors.join("\n - "));
  }

  return Object.freeze({
    nodeEnv,
    isProd,
    isTest: nodeEnv === "test",
    port,
    mongoUri,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    appUrl,
    corsOrigins: toList(env.CORS_ORIGINS),
    // Number of reverse proxies in front of the app (Render/Railway/Heroku = 1). 0 = none.
    trustProxy: Number(env.TRUST_PROXY || 0),
    requireEmailVerification,
    emailTokenTtlMs: 24 * 60 * 60 * 1000,
    smtp,
  });
}

module.exports = buildConfig();
