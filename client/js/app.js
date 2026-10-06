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
function toast(m, bad, ms = 3200) {
  let t = $("#toast") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "toast", role: "status" }));
  t.textContent = m; t.className = bad ? "bad" : ""; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => (t.hidden = true), ms);
}
function busy(btn, on, label) { btn.disabled = on; if (on) { btn._l = btn.textContent; btn.textContent = label || "Please wait…"; } else btn.textContent = btn._l || btn.textContent; }
const skeleton = n => Array(n).fill('<div class="sk"></div>').join("");
const empty = (i, t, p, href, label) => `<div class="empty card"><div class="eic">${ico({ "📁": "folder", "⚠️": "alert" }[i] || "clip")}</div><b>${t}</b>${p}${href ? `<br><a class="btn" href="${href}">${label}</a>` : ""}</div>`;
const fmt = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const late = t => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date(new Date().toDateString());
const label = { todo: "To do", "in-progress": "In progress", done: "Done" };
function taskMeta(t) { return `${esc(t.project?.name || "")}${t.assignedTo ? ` · Assigned to ${esc(t.assignedTo.name)}` : ""}${t.dueDate ? ` · <span class="${late(t) ? "late" : ""}">${late(t) ? "Overdue " : "Due "}${fmt(t.dueDate)}</span>` : ""}`; }
(function nav() {
  if (document.body.hasAttribute("data-private") && !tok()) return location.replace("login.html");
  const p = location.pathname.split("/").pop() || "index.html", l = (h, t) => `<a href="${h}" ${p === h ? 'class="on" aria-current="page"' : ""}>${t}</a>`;
  $("#nav").innerHTML = `<div class="bar"><a class="brand" href="${tok() ? "dashboard.html" : "index.html"}">✓ TaskFlow</a><button id="burger" aria-label="Toggle menu" aria-expanded="false">☰</button><nav id="links" aria-label="Main">${tok() ? l("dashboard.html", "Dashboard") + l("projects.html", "Projects") + l("tasks.html", "Tasks") + `<button class="search" id="searchBtn" aria-label="Search tasks or projects"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><span>Search tasks or projects...</span><kbd>${/Mac/.test(navigator.platform) ? "⌘ K" : "Ctrl K"}</kbd></button><button class="btn sm" id="newTask">+ New Task</button><div class="menu"><button class="avbtn" id="avBtn" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">${avatar(me())}</button><div class="dd" id="dd" role="menu" hidden><div class="who"><b>${esc(me()?.name)}</b><small>${esc(me()?.email)}</small></div><button role="menuitem" data-m="profile">Profile Settings</button><button role="menuitem" data-m="prefs">Workspace Preferences</button><button role="menuitem" data-m="keys">Keyboard Shortcuts</button><hr><button role="menuitem" data-m="out" class="outi">Log Out</button></div></div>` : l("login.html", "Log in") + '<a class="btn" href="/signup">Get Started</a>'}</nav></div>`;
  $("#burger").onclick = e => { const o = $("#links").classList.toggle("open"); e.target.setAttribute("aria-expanded", o); };
})();

function signOut() { localStorage.clear(); sessionStorage.setItem("flash", "You have successfully logged out. Please log in again to access your workspace."); location.replace("index.html"); }
window.addEventListener("pageshow", () => { if (document.body.hasAttribute("data-private") && !tok()) location.replace("login.html"); });
const flash = sessionStorage.getItem("flash"); if (flash) { sessionStorage.removeItem("flash"); toast(flash, 0, 6000); }
const ICO = { folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', check: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', done: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>', alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>' };
const ico = (n, z = 22) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;
async function quickAdd() {
  let ps; try { ps = await api("/projects"); } catch (e) { return toast(e.message, 1); }
  if (!ps.length) { toast("Create a project first, then add tasks.", 1); return setTimeout(() => (location.href = "projects.html"), 1200); }
  $("#qaDlg")?.remove();
  const seg = ["low", "medium", "high"].map(v => `<label><input type="radio" name="priority" value="${v}" ${v === (localStorage.getItem("prefPriority") || "medium") ? "checked" : ""}><span class="badge ${v}">${v}</span></label>`).join("");
  const d = document.body.appendChild(Object.assign(document.createElement("dialog"), { id: "qaDlg", className: "dlg", innerHTML: `<h2>Add a task</h2><form id="qaf" class="qa"><div class="f"><label for="qt">Task title</label><input id="qt" name="title" placeholder="What needs to be done?" maxlength="120" required></div><div class="f"><label for="qp">Project</label><select id="qp" name="project">${ps.map(p => `<option value="${p._id}">${esc(p.name)}</option>`).join("")}</select></div><fieldset class="seg"><legend>Priority</legend>${seg}</fieldset><div class="fields"><div class="f"><label for="qd">Due date</label><input type="date" id="qd" name="dueDate"></div><div class="f"><label for="qa">Assignee</label><select id="qa" name="assignedTo"></select></div></div><p class="err" id="qerr" role="alert"></p><div class="row end"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn">Add task</button></div></form>` }));
  const fill = () => { const p = ps.find(x => x._id === $("#qp").value); $("#qa").innerHTML = '<option value="">Unassigned</option>' + [p.owner, ...p.members].map(u => `<option value="${u._id}">${esc(u.name)}${u._id === me().id ? " (you)" : ""}</option>`).join(""); };
  fill(); $("#qp").onchange = fill;
  d.addEventListener("click", e => { if (e.target === d || e.target.matches("[data-x]")) d.close(); });
  d.addEventListener("close", () => d.remove());
  $("#qaf").addEventListener("submit", async e => {
    e.preventDefault(); const b = $("button:not([data-x])", d); busy(b, true, "Adding…");
    try { await api("/tasks", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); d.close(); toast("Task added"); document.dispatchEvent(new Event("tasks:changed")); }
    catch (x) { $("#qerr").textContent = x.message; busy(b, false); }
  });
  d.showModal(); $("#qt").focus();
}

function dlg(id, html, cls = "") {
  $("#" + id)?.remove();
  const d = document.body.appendChild(Object.assign(document.createElement("dialog"), { id, className: "dlg " + cls, innerHTML: html }));
  d.addEventListener("click", e => { if (e.target === d || e.target.matches("[data-x]")) d.close(); });
  d.addEventListener("close", () => d.remove());
  d.showModal(); return d;
}
function confirmLogout() {
  const d = dlg("logoutDlg", '<h2>Sign Out Confirmation</h2><p class="mute">Are you sure you want to log out? Your projects and tasks are saved, but you will need to log in again to access your workspace.</p><div class="row end"><button class="btn ghost" data-x>Cancel</button><button class="btn warn" data-ok>Log Out</button></div>');
  d.addEventListener("click", e => { if (e.target.matches("[data-ok]")) signOut(); });
}
function keysDlg() {
  const mod = /Mac/.test(navigator.platform) ? "⌘" : "Ctrl";
  dlg("keysDlg", `<h2>Keyboard Shortcuts</h2><table class="keys">${[[mod + " + K", "Open search"], ["N", "Add a new task"], ["?", "Show this list"], ["↑ ↓ then Enter", "Move and open in search"], ["Esc", "Close any dialog or menu"]].map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join("")}</table><div class="row end"><button class="btn" data-x>Close</button></div>`);
}
function prefsDlg() {
  const d = dlg("prefDlg", `<h2>Workspace Preferences</h2><form class="qa"><div class="f"><label for="pp">Default priority for new tasks</label><select id="pp">${["low", "medium", "high"].map(v => `<option ${v === (localStorage.getItem("prefPriority") || "medium") ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="row end"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn">Save</button></div></form>`);
  $("form", d).onsubmit = e => { e.preventDefault(); localStorage.setItem("prefPriority", $("#pp").value); d.close(); toast("Preferences saved"); };
}
function profileDlg() {
  let photo; // undefined = unchanged, null = remove, string = new image
  const u = me(), d = dlg("profDlg", `<h2>Profile Settings</h2><form class="qa"><div class="avrow"><div id="pvw">${avatar(u, "lg")}</div><div class="avbtns"><div class="row"><button type="button" class="btn ghost sm" id="pup">Upload photo</button><button type="button" class="btn ghost sm" id="prm">Remove</button></div><small class="mute">PNG, JPG or WebP. It is cropped to a square.</small></div><input type="file" id="pfile" accept="image/png,image/jpeg,image/webp" hidden></div><div class="f"><label for="pn">Name</label><input id="pn" value="${esc(u?.name)}" maxlength="60" required></div><div class="f"><label for="pe">Email</label><input id="pe" value="${esc(u?.email)}" disabled></div><p class="err" id="perr" role="alert"></p><div class="row end"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn">Save changes</button></div></form>`);
  $("#pup").onclick = () => $("#pfile").click();
  $("#prm").onclick = () => { photo = null; $("#pvw").innerHTML = `<span class="avatar lg">${esc(initials(u?.name))}</span>`; $("#pfile").value = ""; };
  $("#pfile").onchange = async e => {
    const f = e.target.files[0]; $("#perr").textContent = ""; if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) return ($("#perr").textContent = "Please choose a PNG, JPG or WebP image.");
    if (f.size > 8 * 1024 * 1024) return ($("#perr").textContent = "That image is too large. Choose one under 8 MB.");
    try { photo = await squareImage(f); $("#pvw").innerHTML = `<img class="avatar lg" src="${photo}" alt="Preview">`; } catch (x) { $("#perr").textContent = x.message; }
  };
  $("form", d).onsubmit = async e => {
    e.preventDefault(); const b = $("button:not([type=button])", d); busy(b, true, "Saving…");
    try {
      const body = { name: $("#pn").value }; if (photo !== undefined) body.avatar = photo;
      const r = await api("/auth/me", { method: "PUT", body });
      localStorage.setItem("user", JSON.stringify({ id: r._id, name: r.name, email: r.email, avatarVer: r.avatarVer })); location.reload();
    } catch (x) { $("#perr").textContent = x.message; busy(b, false); }
  };
}
function squareImage(file, size = 192) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const c = Object.assign(document.createElement("canvas"), { width: size, height: size }), x = c.getContext("2d"), m = Math.min(img.width, img.height);
      x.fillStyle = "#fff"; x.fillRect(0, 0, size, size);
      x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      let q = 0.85, out = c.toDataURL("image/jpeg", q);
      while (out.length > 120000 && q > 0.4) out = c.toDataURL("image/jpeg", (q -= 0.1));
      res(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("That file could not be read as an image.")); };
    img.src = url;
  });
}
async function palette() {
  const d = dlg("cmdDlg", '<div class="cmd"><input id="cq" placeholder="Search tasks or projects..." autocomplete="off" aria-label="Search tasks or projects"><ul id="cr" role="listbox"><li class="mute">Loading…</li></ul><p class="hint"><kbd>↑</kbd> <kbd>↓</kbd> move <kbd>Enter</kbd> open <kbd>Esc</kbd> close</p></div>', "pal");
  let items = [], view = [], idx = 0;
  const draw = () => {
    const q = $("#cq").value.trim().toLowerCase();
    view = items.filter(i => !q || (i.n + " " + i.s).toLowerCase().includes(q)).slice(0, 8); idx = Math.min(idx, Math.max(view.length - 1, 0));
    $("#cr").innerHTML = view.length ? view.map((i, n) => `<li role="option" data-i="${n}" aria-selected="${n === idx}" class="${n === idx ? "sel" : ""}"><span class="badge">${i.k}</span><span><b>${esc(i.n)}</b><small>${esc(i.s)}</small></span></li>`).join("") : `<li class="mute">No results for "${esc($("#cq").value)}"</li>`;
  };
  try {
    const [p, t] = await Promise.all([api("/projects"), api("/tasks")]);
    items = [...p.map(x => ({ k: "Project", n: x.name, s: `${x.members.length + 1} people`, u: "tasks.html?project=" + x._id })), ...t.map(x => ({ k: "Task", n: x.title, s: `${x.project?.name || ""} · ${label[x.status]}`, u: x.project ? "tasks.html?project=" + x.project._id : "tasks.html" }))];
  } catch (e) { $("#cr").innerHTML = `<li class="mute">${esc(e.message)}</li>`; return; }
  draw();
  $("#cq").addEventListener("input", () => { idx = 0; draw(); });
  $("#cq").addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(idx + 1, view.length - 1); draw(); }
    if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(idx - 1, 0); draw(); }
    if (e.key === "Enter" && view[idx]) location.href = view[idx].u;
  });
  $("#cr").addEventListener("click", e => { const li = e.target.closest("[data-i]"); if (li) location.href = view[li.dataset.i].u; });
}
function wireNav() {
  $("#newTask").onclick = quickAdd; $("#searchBtn").onclick = palette; invBadge();
  const b = $("#avBtn"), dd = $("#dd"), close = () => { dd.hidden = true; b.setAttribute("aria-expanded", "false"); };
  b.onclick = e => { e.stopPropagation(); dd.hidden = !dd.hidden; b.setAttribute("aria-expanded", !dd.hidden); };
  document.addEventListener("click", e => { if (!e.target.closest(".menu")) close(); });
  dd.onclick = e => { const m = e.target.dataset.m; if (m) { close(); ({ profile: profileDlg, prefs: prefsDlg, keys: keysDlg, out: confirmLogout })[m](); } };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(); }
    const busyEl = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $("dialog[open]");
    if (!busyEl && !e.ctrlKey && !e.metaKey && e.key === "n") quickAdd();
    if (!busyEl && e.key === "?") keysDlg();
  });
}
if (tok()) wireNav();

const timeAgo = d => { const m = Math.floor((Date.now() - new Date(d)) / 6e4), h = Math.floor(m / 60), n = Math.floor(h / 24), u = (v, w) => `${v} ${w}${v === 1 ? "" : "s"} ago`; return m < 1 ? "Just now" : m < 60 ? u(m, "minute") : h < 24 ? u(h, "hour") : n < 30 ? u(n, "day") : new Date(d).toLocaleDateString(); };
const md = s => {
  let h = esc(s || "").replace(/^#{1,3} (.*)$/gm, "<h4>$1</h4>").replace(/^(?:- |\* )(.*)$/gm, "<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g, m => "<ul>" + m.trim() + "</ul>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return h.replace(/\n/g, "<br>").replace(/<\/(h4|ul|li)><br>/g, "</$1>").replace(/<br><(h4|ul)>/g, "<$1>");
};
document.addEventListener("click", e => { const o = e.target.closest("[data-open]"); if (o) openTask(o.dataset.open); });
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.("[data-open]")) openTask(e.target.dataset.open); });
async function openTask(id) {
  let t; try { t = await api("/tasks/" + id); } catch (e) { return toast(e.message, 1); }
  const d = dlg("taskDrawer", "", "drawer"), q = s => d.querySelector(s); let editing = false;
  const people = [t.project?.owner, ...(t.project?.members || [])].filter(Boolean);
  const assignee = () => `<div class="f"><label for="ta">Assignee</label><select id="ta"><option value="">Unassigned</option>${people.map(u => `<option value="${u._id}" ${t.assignedTo?._id === u._id ? "selected" : ""}>${esc(u.name)}${u._id === me().id ? " (you)" : ""}</option>`).join("")}</select></div>`;
  const save = async patch => { try { t = await api("/tasks/" + id, { method: "PUT", body: patch }); document.dispatchEvent(new Event("tasks:changed")); } catch (x) { toast(x.message, 1); } draw(); };
  const opts = (arr, cur) => arr.map(([v, l]) => `<option value="${v}" ${v === cur ? "selected" : ""}>${l}</option>`).join("");
  function draw() {
    const subs = t.subtasks || [], dn = subs.filter(x => x.done).length, pc = subs.length ? Math.round((dn / subs.length) * 100) : 0;
    const feed = [{ at: t.createdAt, text: "Task created" }, ...(t.history || []), ...(t.comments || []).map(c => ({ ...c, c: 1 }))].sort((a, b) => new Date(a.at) - new Date(b.at));
    d.innerHTML = `<header class="dh"><input id="tt" value="${esc(t.title)}" maxlength="120" aria-label="Task title"><button class="btn ghost sm" data-x aria-label="Close">✕</button></header><div class="db">
<div class="fields"><div class="f"><label for="ts">Status</label><select id="ts">${opts(Object.entries(label), t.status)}</select></div><div class="f"><label for="tp">Priority</label><select id="tp">${opts([["low", "Low"], ["medium", "Medium"], ["high", "High"]], t.priority)}</select></div>${assignee()}</div>
<p class="mute meta">${taskMeta(t)}</p>
<section><div class="row"><h3>Description</h3>${editing ? "" : '<button class="btn ghost sm" id="de">Edit</button>'}</div>${editing ? `<textarea id="dt" rows="6" placeholder="Supports **bold**, *italic*, - lists and [links](https://…)">${esc(t.description)}</textarea><div class="row end"><button class="btn ghost sm" id="dc">Cancel</button><button class="btn sm" id="dsv">Save</button></div>` : `<div class="md">${t.description ? md(t.description) : '<span class="mute">No description yet.</span>'}</div>`}</section>
<section><div class="row"><h3>Subtasks</h3><small class="mute">${dn}/${subs.length} done</small></div>${subs.length ? `<div class="prog" role="progressbar" aria-label="Subtask progress" aria-valuenow="${pc}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pc}%"></i></div>` : ""}<ul class="subs">${subs.map((x, i) => `<li><label><input type="checkbox" data-s="${i}" ${x.done ? "checked" : ""}> <span class="${x.done ? "dn" : ""}">${esc(x.title)}</span></label><button class="btn ghost sm" data-rm="${i}" aria-label="Remove subtask">✕</button></li>`).join("")}</ul><form id="sf" class="inl"><input id="sn" placeholder="Add a subtask" maxlength="120"><button class="btn sm">Add</button></form></section>
<section><h3>Activity</h3><ul class="feed">${feed.map(f => f.c ? `<li class="cm"><b>${esc(f.name)}</b> <small>${timeAgo(f.at)}</small><div class="md">${md(f.text)}</div></li>` : `<li class="ev">${esc(f.text)} <small>${timeAgo(f.at)}</small></li>`).join("")}</ul><form id="cf" class="inl"><textarea id="cn" rows="2" placeholder="Write a comment…" maxlength="1000"></textarea><button class="btn sm">Comment</button></form></section></div>`;
  }
  d.addEventListener("change", e => {
    const el = e.target;
    if (el.id === "tt") { el.value.trim() && el.value !== t.title ? save({ title: el.value.trim() }) : (el.value = t.title); }
    if (el.id === "ts") save({ status: el.value });
    if (el.id === "tp") save({ priority: el.value });
    if (el.id === "ta") save({ assignedTo: el.value || null });
    if (el.dataset.s !== undefined) save({ subtasks: t.subtasks.map((x, i) => (i === +el.dataset.s ? { title: x.title, done: el.checked } : x)) });
  });
  d.addEventListener("click", e => {
    const b = e.target;
    if (b.id === "de") { editing = true; draw(); q("#dt").focus(); }
    if (b.id === "dc") { editing = false; draw(); }
    if (b.id === "dsv") { editing = false; save({ description: q("#dt").value }); }
    if (b.dataset.rm !== undefined) save({ subtasks: t.subtasks.filter((_, i) => i !== +b.dataset.rm) });
  });
  d.addEventListener("submit", async e => {
    e.preventDefault();
    if (e.target.id === "sf") { const v = q("#sn").value.trim(); if (v) save({ subtasks: [...t.subtasks, { title: v, done: false }] }); }
    if (e.target.id === "cf") { const v = q("#cn").value.trim(); if (!v) return; try { t = await api(`/tasks/${id}/comments`, { method: "POST", body: { text: v } }); draw(); } catch (x) { toast(x.message, 1); } }
  });
  draw();
}
Object.assign(ICO, { plus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>', chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', folderplus: '<path d="M12 10v6M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>' });

const calm = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
function countUp(el, to, from = 0, fmt = v => v, ms = 900) {
  if (calm() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), ease = x => 1 - Math.pow(1 - x, 3);
  (function tick(now) {
    const p = Math.min((now - t0) / ms, 1);
    el.textContent = fmt(Math.round(from + (to - from) * ease(p)));
    if (p < 1 && el.isConnected) requestAnimationFrame(tick); else el.textContent = fmt(to);
  })(t0);
}

function initials(n) { return (n || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(); }
function avUrl(u) { return u?.avatarVer ? `/api/auth/avatar/${u._id || u.id}?v=${new Date(u.avatarVer).getTime()}` : ""; }
function avatar(u, cls = "") { const n = esc(u?.name || ""); return avUrl(u) ? `<img class="avatar ${cls}" src="${avUrl(u)}" alt="${n}" title="${n}">` : `<span class="avatar ${cls}" title="${n}">${esc(initials(u?.name))}</span>`; }
async function invBadge() {
  $("#links .dot")?.remove();
  try { const l = await api("/invites"), a = $('#links a[href="projects.html"]'); if (l.length && a) a.insertAdjacentHTML("beforeend", `<span class="dot" title="${l.length} pending invitation${l.length === 1 ? "" : "s"}">${l.length}</span>`); } catch {}
}
