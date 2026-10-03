(async () => {
  $("#hi").textContent = "Welcome back, " + (me()?.name || "").split(" ")[0];
  try {
    const [p, t] = await Promise.all([api("/projects"), api("/tasks")]), c = s => t.filter(x => x.status === s).length;
    $("#stats").innerHTML = [["Projects", p.length], ["Tasks", t.length], ["In progress", c("in-progress")], ["Done", c("done")]].map(([a, b]) => `<div class="card stat"><span>${a}</span><strong>${b}</strong></div>`).join("");
    $("#recent").innerHTML = t.length ? t.slice(0, 6).map(x => `<div class="card item"><div><b>${esc(x.title)}</b><br><small>${taskMeta(x)}</small></div><span class="badge">${label[x.status]}</span></div>`).join("") : empty("📋", "No tasks yet", p.length ? "Add your first task to get moving." : "Create a project first, then add tasks to it.", p.length ? "tasks.html" : "projects.html", p.length ? "Add a task" : "Create a project");
  } catch (e) { toast(e.message, 1); $("#recent").innerHTML = empty("⚠️", "Could not load your data", e.message); }
})();
