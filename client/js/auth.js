const f = $("#authForm"), reg = f?.dataset.mode === "register", pw = $("#pw");
if (tok()) location.replace("dashboard.html");
const I = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const eyeOn = I + '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOff = I + '<path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 5.1A10 10 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M1 1l22 22"/></svg>';
const eye = $(".eye");
eye.innerHTML = eyeOn; eye.setAttribute("aria-label", "Show password");
eye.onclick = () => { const show = pw.type === "password"; pw.type = show ? "text" : "password"; eye.innerHTML = show ? eyeOff : eyeOn; eye.setAttribute("aria-label", show ? "Hide password" : "Show password"); pw.focus(); };

const rules = [[/.{8,}/, "At least 8 characters"], [/[a-z]/, "A lowercase letter"], [/[A-Z]/, "An uppercase letter"], [/\d/, "A number"], [/[^A-Za-z0-9]/, "A symbol (for example ! @ # $)"]];
function check() {
  const ok = rules.map(([r]) => r.test(pw.value)), n = ok.filter(Boolean).length;
  $("#rules").innerHTML = rules.map(([, t], i) => `<li class="${ok[i] ? "ok" : ""}">${t}</li>`).join("");
  const lv = !pw.value ? ["", 0, ""] : n <= 2 ? ["Weak", 25, "var(--bad)"] : n < 5 ? ["Fair", 60, "var(--warn)"] : pw.value.length >= 12 ? ["Very strong", 100, "var(--brand)"] : ["Strong", 85, "var(--brand)"];
  $("#bar").style.width = lv[1] + "%"; $("#bar").style.background = lv[2];
  $("#lvl").textContent = lv[0] && "Password strength: " + lv[0];
  $("button.btn", f).disabled = !(n === 5 && $("#agree").checked);
}
if (reg) { pw.addEventListener("input", check); $("#agree").addEventListener("change", check); check(); }

f.addEventListener("submit", async e => {
  e.preventDefault(); const b = $("button.btn", f); $("#err").textContent = "";
  const d = Object.fromEntries(new FormData(f));
  if (!d.email || !d.password || (reg && !d.name)) return ($("#err").textContent = "Please fill in all fields.");
  busy(b, true, reg ? "Creating account…" : "Logging in…");
  try {
    const r = await api("/auth/" + f.dataset.mode, { method: "POST", body: d });
    localStorage.setItem("token", r.token); localStorage.setItem("user", JSON.stringify(r.user)); location.href = "dashboard.html";
  } catch (x) { $("#err").textContent = x.message; busy(b, false); if (reg) check(); }
});
