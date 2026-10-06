const f = $("#tf"), sel = $("#proj"), flt = $("#filter"); let tasks = [], projs = [];
const fillAsg = () => { const p = projs.find(x => x._id === sel.value); $("#asg").innerHTML = '<option value="">Unassigned</option>' + (p ? [p.owner, ...p.members] : []).map(u => `<option value="${u._id}">${esc(u.name)}${u._id === me().id ? " (you)" : ""}</option>`).join(""); };
const card = t => `<article class="card task" data-id="${t._id}"><div class="row"><b class="lnk" data-open="${t._id}" tabindex="0" role="button">${esc(t.title)}</b><span class="badge ${t.priority}">${t.priority}</span></div><small>${taskMeta(t)}</small><div class="row"><select aria-label="Status">${Object.entries(label).map(([k, v]) => `<option value="${k}" ${k === t.status ? "selected" : ""}>${v}</option>`).join("")}</select><button class="btn danger sm" data-del>Delete</button></div></article>`;
function draw() {
  const w = $("#who").value, list = tasks.filter(t => (!flt.value || t.project?._id === flt.value) && (!w || (w === "me" ? t.assignedTo?._id === me().id : !t.assignedTo)));
  $("#board").innerHTML = Object.entries(label).map(([k, v]) => { const x = list.filter(t => t.status === k); return `<section class="col" aria-label="${v}"><h3>${v}<span class="badge">${x.length}</span></h3>${x.map(card).join("") || '<p class="mute" style="text-align:center;padding:1rem 0">Nothing here yet</p>'}</section>`; }).join("");
}
async function load() {
  $("#board").innerHTML = skeleton(3);
  try {
    const keepP = sel.value, keepF = flt.value, p = await api("/projects"); projs = p; tasks = await api("/tasks");
    const opts = p.map(x => `<option value="${x._id}">${esc(x.name)}</option>`).join("");
    sel.innerHTML = opts; flt.innerHTML = '<option value="">All projects</option>' + opts;
    if (keepP && p.some(x => x._id === keepP)) sel.value = keepP; fillAsg();
    const qp = new URLSearchParams(location.search).get("project"); if (keepF && p.some(x => x._id === keepF)) flt.value = keepF; else if (qp) flt.value = qp;
    if (!p.length) { f.hidden = flt.parentElement.hidden = true; $("#board").className = ""; return ($("#board").innerHTML = empty("📁", "Create a project first", "Tasks belong to projects.", "projects.html", "Create a project")); }
    draw();
  } catch (e) { $("#board").innerHTML = empty("⚠️", "Could not load tasks", e.message); }
}
f.addEventListener("submit", async e => {
  e.preventDefault(); const b = $("button", f); busy(b, true, "Adding…");
  try { tasks.unshift(await api("/tasks", { method: "POST", body: Object.fromEntries(new FormData(f)) })); f.reset(); fillAsg(); draw(); toast("Task added"); } catch (x) { toast(x.message, 1); }
  busy(b, false);
});
flt.onchange = draw; $("#who").onchange = draw; sel.onchange = fillAsg;
$("#board").addEventListener("change", async e => {
  const id = e.target.closest("article")?.dataset.id; if (!id) return;
  try { const u = await api("/tasks/" + id, { method: "PUT", body: { status: e.target.value } }); tasks = tasks.map(t => (t._id === id ? u : t)); draw(); toast("Task moved to " + label[u.status]); } catch (x) { toast(x.message, 1); load(); }
});
$("#board").addEventListener("click", async e => {
  const id = e.target.closest("article")?.dataset.id;
  if (!id || !e.target.matches("[data-del]") || !confirm("Delete this task?")) return;
  try { await api("/tasks/" + id, { method: "DELETE" }); tasks = tasks.filter(t => t._id !== id); draw(); toast("Task deleted"); } catch (x) { toast(x.message, 1); }
});
load();
document.addEventListener("tasks:changed", load);
