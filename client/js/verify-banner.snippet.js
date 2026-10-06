// OPTIONAL: paste at the very END of client/js/app.js.
// Shows a notice at the top of every page while the logged-in user has not verified their email.
(() => {
  const u = me();
  if (!tok() || !u || u.emailVerified !== false) return;
  const main = $("main");
  if (!main) return;
  const bar = document.createElement("div");
  bar.className = "card";
  bar.setAttribute("role", "status");
  bar.innerHTML = 'Please verify your email to see and accept project invitations. <a href="verify-email.html">Resend the verification email</a>';
  main.prepend(bar);
})();
