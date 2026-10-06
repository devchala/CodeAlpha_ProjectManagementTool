// Uses helpers from app.js: $, api, toast, busy, tok, me
(async () => {
  const msg = $("#msg");
  const resend = $("#resend");
  const token = new URLSearchParams(location.search).get("token");

  // Remove the one-time token from the address bar / browser history right away.
  history.replaceState(null, "", location.pathname);

  const offerResend = () => {
    if (tok()) resend.hidden = false;
    else $("#login").hidden = false;
  };

  resend.onclick = async () => {
    busy(resend, true, "Sending…");
    try {
      const r = await api("/auth/resend-verification", { method: "POST" });
      msg.textContent = r.message;
      toast(r.message);
    } catch (e) {
      msg.textContent = e.message;
    }
    busy(resend, false);
  };

  if (!token) {
    msg.textContent = "This page needs the link from your verification email.";
    return offerResend();
  }

  try {
    const r = await api("/auth/verify-email", { method: "POST", body: { token } });
    msg.textContent = r.message;
    const user = me();
    if (user) localStorage.setItem("user", JSON.stringify({ ...user, emailVerified: true }));
    const go = $("#go");
    go.hidden = false;
    if (!tok()) {
      go.href = "login.html";
      go.textContent = "Log in";
    }
  } catch (e) {
    msg.textContent = e.message;
    offerResend();
  }
})();
