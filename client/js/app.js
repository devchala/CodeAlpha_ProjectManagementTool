const $ = (s, r = document) => r.querySelector(s);
const tok = () => localStorage.getItem("token");
const me = () => JSON.parse(localStorage.getItem("user") || "null");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function logout() { localStorage.clear(); location.href = "login.html"; }
async function api(path, o = {}) {
  const r = await fetch("/api" + path, { method: o.method || "GET", headers: { "Content-Type": "application/json", ...(tok() && { Authorization: "Bearer " + tok() }) }, body: o.body && JSON.stringify(o.body) });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && tok()) logout();
  if (!r.ok) throw new Error(d.message || "Something went wrong. Please try again.");
  return d;
}
function toast(m, bad) {
  let t = $("#toast") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "toast", role: "status" }));
  t.textContent = m; t.className = bad ? "bad" : ""; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), 3200);
}
function busy(btn, on, label) { btn.disabled = on; if (on) { btn._l = btn.textContent; btn.textContent = label || "Please wait…"; } else btn.textContent = btn._l || btn.textContent; }
const skeleton = n => Array(n).fill('<div class="sk"></div>').join("");
const empty = (i, t, p, href, label) => `<div class="empty card"><i>${i}</i><b>${t}</b>${p}${href ? `<br><a class="btn" href="${href}">${label}</a>` : ""}</div>`;
const fmt = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const late = t => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date(new Date().toDateString());
const label = { todo: "To do", "in-progress": "In progress", done: "Done" };
function taskMeta(t) { return `${esc(t.project?.name || "")}${t.dueDate ? ` · <span class="${late(t) ? "late" : ""}">${late(t) ? "Overdue " : "Due "}${fmt(t.dueDate)}</span>` : ""}`; }
(function nav() {
  if (document.body.hasAttribute("data-private") && !tok()) return location.replace("login.html");
  const p = location.pathname.split("/").pop() || "index.html", l = (h, t) => `<a href="${h}" ${p === h ? 'class="on" aria-current="page"' : ""}>${t}</a>`;
  $("#nav").innerHTML = `<div class="bar"><a class="brand" href="${tok() ? "dashboard.html" : "index.html"}">✓ TaskFlow</a><button id="burger" aria-label="Toggle menu" aria-expanded="false">☰</button><nav id="links" aria-label="Main">${tok() ? l("dashboard.html", "Dashboard") + l("projects.html", "Projects") + l("tasks.html", "Tasks") + `<span class="user">${esc(me()?.name)}</span><button class="btn ghost sm" id="out">Log out</button>` : l("login.html", "Log in") + '<a class="btn" href="register.html">Create account</a>'}</nav></div>`;
  $("#burger").onclick = e => { const o = $("#links").classList.toggle("open"); e.target.setAttribute("aria-expanded", o); };
  $("#out")?.addEventListener("click", logout);
})();
