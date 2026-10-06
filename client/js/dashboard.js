let first = true, prev = {}, prevPct = 0, tasks = [], projs = [], hasP = 0, view = localStorage.getItem("dashView") || "list";
const row = x => `<div class="card item" tabindex="0" role="button" data-open="${x._id}"><div><b>${esc(x.title)}</b><br><small>${taskMeta(x)}</small></div><span><span class="badge ${x.priority}">${x.priority}</span> <span class="badge">${label[x.status]}</span></span></div>`;
function drawTasks() {
  const f = $("#pf").value, list = tasks.filter(x => !f || x.priority === f), box = $("#recent");
  document.querySelectorAll(".vt button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === view));
  if (!tasks.length) { box.className = "list"; box.innerHTML = empty("📋", "No tasks yet", "Add your first task, or start with a ready-made example.") + `<div class="card qs"><h3>Quick start</h3><p class="mute">Adds a project with 3 demo tasks (Set up repository, Design landing page, Deploy to server) so you can try the dashboard right away.</p><div class="row"><button class="btn ghost sm" data-sample>Create sample project</button>${hasP ? '<button class="btn ghost sm" data-add>Add a task</button>' : '<a class="btn ghost sm" href="projects.html">Create a project</a>'}</div></div>`; return; }
  if (!list.length) { box.className = "list"; box.innerHTML = empty("📋", "No matching tasks", "Try a different priority filter."); return; }
  if (view === "board") { box.className = "board"; box.innerHTML = Object.entries(label).map(([k, v]) => `<section class="col" aria-label="${v}"><h3>${v}</h3>${list.filter(x => x.status === k).slice(0, 5).map(row).join("") || '<p class="mute">Nothing here</p>'}</section>`).join(""); }
  else { box.className = "list"; box.innerHTML = list.slice(0, 8).map(row).join(""); }
}
async function render() {
  $("#hi").textContent = "Welcome back, " + (me()?.name || "").split(" ")[0];
  try {
    const [p, t] = await Promise.all([api("/projects"), api("/tasks")]), c = s => t.filter(x => x.status === s).length;
    const done = c("done"), pct = t.length ? Math.round((done / t.length) * 100) : 0, od = t.filter(late).length, wk = t.filter(x => Date.now() - new Date(x.createdAt) < 6048e5).length;
    $("#fill").style.width = pct + "%"; $("#pbar").setAttribute("aria-valuenow", pct); countUp($("#pct"), pct, prevPct, v => (t.length ? `${v}% complete · ${done} of ${t.length} done` : `${v}% complete`)); prevPct = pct; const pend = t.filter(x => x.status !== "done"), np = new Set(pend.map(x => x.project?._id)).size, pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    $("#ptxt").textContent = !t.length ? "Your workspace is clear. Create a task or pick up a project below to get started." : pend.length ? `You have ${pl(pend.length, "task")} pending across ${pl(np, "project")} today.` : "All caught up. Every task is done.";
    $("#stats").innerHTML = [["folder", "Projects", p.length, p.length ? "Active" : "Get started"], ["check", "Tasks", t.length, wk + " new this week"], ["clock", "In progress", c("in-progress"), od ? od + " overdue" : "On track", od], ["done", "Done", done, pct + "% complete"]].map(([i, a, n, b, w], k) => `<div class="card stat${first ? " rise" : ""}"${first ? ` style="--d:${260 + k * 70}ms"` : ""}><div class="sh"><span class="sic">${ico(i)}</span><span class="tag ${w ? "warn" : ""}">${b}</span></div><span>${a}</span><strong data-k="${a}" data-to="${n}">${prev[a] ?? 0}</strong></div>`).join("");
    document.querySelectorAll("#stats strong").forEach((el, k) => { const key = el.dataset.k, to = +el.dataset.to, from = prev[key] ?? 0; prev[key] = to; setTimeout(() => countUp(el, to, from), first && !calm() ? 260 + k * 70 : 0); });
    first = false;
    tasks = t; projs = p; hasP = p.length; drawTasks();
    const doneAt = x => (x.history || []).filter(h => /to done$/.test(h.text)).pop()?.at || x.updatedAt;
    const ev = [
      ...p.map(x => ({ k: "proj", t: x.createdAt, m: `<b>${esc(x.owner?.name)}</b> created project <b>${esc(x.name)}</b>` })),
      ...t.map(x => ({ k: "new", t: x.createdAt, m: `Task <b>${esc(x.title)}</b> added to ${esc(x.project?.name)}` })),
      ...t.filter(x => x.status === "done").map(x => ({ k: "done", t: doneAt(x), m: `Task <b>${esc(x.title)}</b> completed` })),
      ...t.flatMap(x => (x.comments || []).map(c => ({ k: "cmt", t: c.at, m: `<b>${esc(c.name)}</b> commented on <b>${esc(x.title)}</b>` })))
    ].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 8), IC = { proj: "folderplus", new: "plus", done: "done", cmt: "chat" };
    $("#act").innerHTML = ev.length ? ev.map(e => `<li class="tl-${e.k}"><span class="tl-ic">${ico(IC[e.k], 16)}</span><div><p>${e.m}</p><small>${timeAgo(e.t)}</small></div></li>`).join("") : '<li class="mute">Activity will show up here as you work.</li>';
  } catch (e) { toast(e.message, 1); $("#recent").innerHTML = empty("⚠️", "Could not load your data", e.message); }
}
document.addEventListener("click", async e => {
  if (e.target.closest("[data-add]")) quickAdd();
  if (e.target.matches("[data-sample]")) {
    busy(e.target, true, "Creating…");
    try {
      await createSample();
      toast("Sample project created with 3 demo tasks"); render();
    } catch (x) { toast(x.message, 1); busy(e.target, false); }
  }
});
document.addEventListener("tasks:changed", render);
render();
$("#pf").onchange = drawTasks;
$(".vt").onclick = e => { const v = e.target.dataset.v; if (v) { view = v; localStorage.setItem("dashView", v); drawTasks(); } };

const DEMO = [
  { title: "Set up repository", status: "done", priority: "high", description: "Create the **GitHub repository** and push the first commit.\n\n- Add a README\n- Add a .gitignore", subtasks: [["Create repository", 1], ["Add README", 1], ["Add .gitignore", 1]] },
  { title: "Design landing page", status: "in-progress", priority: "medium", description: "Sketch the hero section and the feature cards.", subtasks: [["Sketch the layout", 1], ["Pick colors and fonts", 0], ["Build the hero section", 0]] },
  { title: "Deploy to server", status: "todo", priority: "low", description: "Publish the app so teammates can use it.", subtasks: [] }
];
async function createSample() {
  const n = projs.filter(x => x.name.startsWith("Sample project")).length;
  const pr = await api("/projects", { method: "POST", body: { name: "Sample project" + (n ? " " + (n + 1) : ""), description: "A starter project with demo tasks to explore TaskFlow." } });
  for (const d of DEMO) {
    const t = await api("/tasks", { method: "POST", body: { title: d.title, project: pr._id, priority: d.priority } });
    await api("/tasks/" + t._id, { method: "PUT", body: { status: d.status, description: d.description, subtasks: d.subtasks.map(([title, done]) => ({ title, done: !!done })) } });
  }
}
