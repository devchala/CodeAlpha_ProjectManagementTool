const box = $("#list"), f = $("#pf");
async function load() {
  box.innerHTML = skeleton(3);
  try {
    const [p, t] = await Promise.all([api("/projects"), api("/tasks")]);
    box.innerHTML = p.length ? p.map(x => `<article class="card" data-id="${x._id}"><h3>${esc(x.name)}</h3><p class="mute">${esc(x.description) || "No description"}</p><p><small>${t.filter(k => k.project?._id === x._id).length} tasks · ${x.members.length + 1} people · by ${esc(x.owner?.name)}</small></p>${x.owner?._id === me().id ? '<div class="row"><button class="btn ghost sm" data-add>Add member</button><button class="btn danger sm" data-del>Delete</button></div>' : ""}</article>`).join("") : empty("📁", "No projects yet", "Create your first project using the form above.");
  } catch (e) { box.innerHTML = empty("⚠️", "Could not load projects", e.message); }
}
f.addEventListener("submit", async e => {
  e.preventDefault(); const b = $("button", f); busy(b, true, "Creating…");
  try { await api("/projects", { method: "POST", body: Object.fromEntries(new FormData(f)) }); f.reset(); toast("Project created"); await load(); } catch (x) { toast(x.message, 1); }
  busy(b, false);
});
box.addEventListener("click", async e => {
  const id = e.target.closest("article")?.dataset.id; if (!id) return;
  try {
    if (e.target.matches("[data-del]") && confirm("Delete this project and all its tasks?")) { await api("/projects/" + id, { method: "DELETE" }); toast("Project deleted"); load(); }
    if (e.target.matches("[data-add]")) { const email = prompt("Email of the person to add (they must be registered):"); if (email) { await api(`/projects/${id}/members`, { method: "POST", body: { email } }); toast("Member added"); load(); } }
  } catch (x) { toast(x.message, 1); }
});
load();
