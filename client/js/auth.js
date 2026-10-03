const f = $("#authForm");
if (tok()) location.replace("dashboard.html");
f?.addEventListener("submit", async e => {
  e.preventDefault(); const b = $("button", f), reg = f.dataset.mode === "register"; $("#err").textContent = "";
  busy(b, true, reg ? "Creating account…" : "Logging in…");
  try {
    const d = await api("/auth/" + f.dataset.mode, { method: "POST", body: Object.fromEntries(new FormData(f)) });
    localStorage.setItem("token", d.token); localStorage.setItem("user", JSON.stringify(d.user)); location.href = "dashboard.html";
  } catch (x) { $("#err").textContent = x.message; busy(b, false); }
});
