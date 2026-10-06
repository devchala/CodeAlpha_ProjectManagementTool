const config = require("../config/env");

let transporter;

function getTransporter() {
  if (!config.smtp) return null;
  if (!transporter) {
    // Required lazily so local development works even before SMTP is configured.
    const nodemailer = require("nodemailer");
    const { host, port, secure, user, pass } = config.smtp;
    transporter = nodemailer.createTransport({ host, port, secure, auth: user ? { user, pass } : undefined });
  }
  return transporter;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function sendVerificationEmail(user, token) {
  const link = `${config.appUrl}/verify-email.html?token=${token}`;
  const mailer = getTransporter();

  if (!mailer) {
    // Development convenience only. Production refuses to boot without SMTP (see config/env.js).
    console.log(`[mail] SMTP not configured. Verification link for ${user.email}:\n${link}`);
    return;
  }

  await mailer.sendMail({
    from: config.smtp.from,
    to: user.email,
    subject: "Verify your TaskFlow email address",
    text: `Hi ${user.name},\n\nConfirm your email address to start accepting project invitations:\n${link}\n\nThis link expires in 24 hours. If you did not create a TaskFlow account, ignore this email.`,
    html: `<p>Hi ${escapeHtml(user.name)},</p><p>Confirm your email address to start accepting project invitations:</p><p><a href="${link}">Verify my email</a></p><p>This link expires in 24 hours. If you did not create a TaskFlow account, ignore this email.</p>`,
  });
}

module.exports = { sendVerificationEmail };
