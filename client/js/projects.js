const box = $("#list"), f = $("#pf"); let projects = [];
const you = u => u._id === me().id;
const person = (u, extra = "") => `<li class="mem">${avatar(u)}<div><b>${esc(u.name)}${you(u) ? " (you)" : ""}</b><small>${esc(u.email)}</small></div>${extra}</li>`;
async function loadInvites() {
  try {
    const l = await api("/invites"); $("#inv").hidden = !l.length;
    $("#invl").innerHTML = l.map(i => `<li class="mem row" data-id="${i._id}"><span><b>${esc(i.invitedBy?.name)}</b> invited you to <b>${esc(i.project?.name)}</b></span><span><button class="btn sm" data-acc>Accept</button> <button class="btn ghost sm" data-dec>Decline</button></span></li>`).join("");
  } catch {}
}
async function load() {
  box.innerHTML = skeleton(3);
  try {
    const [p, t] = await Promise.all([api("/projects"), api("/tasks")]); projects = p;
    box.innerHTML = p.length ? p.map(x => `<article class="card" data-id="${x._id}"><h3>${esc(x.name)}</h3><p class="mute">${esc(x.description) || "No description"}</p><div class="av-stack">${[x.owner, ...x.members].slice(0, 5).map(u => avatar(u, "sm")).join("")}</div><p><small>${t.filter(k => k.project?._id === x._id).length} tasks · ${x.members.length + 1} people · by ${esc(x.owner?.name)}</small></p><div class="row"><button class="btn ghost sm" data-team>Team</button>${you(x.owner) ? '<button class="btn danger sm" data-del>Delete</button>' : ""}</div></article>`).join("") : empty("📁", "No projects yet", "Create your first project using the form above.");
  } catch (e) { box.innerHTML = empty("⚠️", "Could not load projects", e.message); }
}
function team(id) {
  const p = projects.find(x => x._id === id); if (!p) return;
  const owner = you(p.owner);
  (async () => {
    let inv = []; if (owner) { try { inv = await api(`/projects/${id}/invites`); } catch {} }
    const d = dlg("teamDlg", `<h2>${esc(p.name)} team</h2><ul class="mems">${person(p.owner, '<span class="badge">Owner</span>')}${p.members.map(m => person(m, owner || you(m) ? `<button class="btn danger sm" data-rm="${m._id}">${you(m) ? "Leave" : "Remove"}</button>` : "")).join("")}</ul>${owner ? `<h3>Invite by email</h3><form id="invf" class="inl"><input type="email" id="inve" placeholder="teammate@example.com" aria-label="Email address" required><button class="btn sm">Send invite</button></form><p class="err" id="inverr" role="alert"></p>${inv.length ? `<h3>Pending invitations</h3><ul class="mems">${inv.map(i => `<li class="mem row" data-iid="${i._id}"><span>${esc(i.email)}</span><button class="btn ghost sm" data-rv>Revoke</button></li>`).join("")}</ul>` : ""}` : ""}<div class="row end"><button class="btn" data-x>Close</button></div>`);
    d.addEventListener("submit", async e => {
      e.preventDefault(); if (e.target.id !== "invf") return;
      const b = $("button", e.target); busy(b, true, "Sending…"); $("#inverr").textContent = "";
      try {
        const r = await api(`/projects/${id}/invites`, { method: "POST", body: { email: $("#inve").value } });
        toast(r.registered ? "Invitation sent. They can accept it under Projects." : "Invitation saved. They will see it once they register with that email.");
        await load(); team(id);
      } catch (x) { $("#inverr").textContent = x.message; busy(b, false); }
    });
    d.addEventListener("click", async e => {
      try {
        if (e.target.matches("[data-rm]")) {
          const self = e.target.dataset.rm === me().id;
          if (!confirm(self ? "Leave this project?" : "Remove this member? Their tasks will become unassigned.")) return;
          await api(`/projects/${id}/members/${e.target.dataset.rm}`, { method: "DELETE" }); toast(self ? "You left the project" : "Member removed");
          await load(); self ? d.close() : team(id);
        }
        if (e.target.matches("[data-rv]")) { await api(`/projects/${id}/invites/${e.target.closest("[data-iid]").dataset.iid}`, { method: "DELETE" }); toast("Invitation revoked"); team(id); }
      } catch (x) { toast(x.message, 1); }
    });
  })();
}
f.addEventListener("submit", async e => {
  e.preventDefault(); const b = $("button", f); busy(b, true, "Creating…");
  try { await api("/projects", { method: "POST", body: Object.fromEntries(new FormData(f)) }); f.reset(); toast("Project created"); await load(); } catch (x) { toast(x.message, 1); }
  busy(b, false);
});
box.addEventListener("click", async e => {
  const id = e.target.closest("article")?.dataset.id; if (!id) return;
  if (e.target.matches("[data-team]")) team(id);
  if (e.target.matches("[data-del]") && confirm("Delete this project and all its tasks?")) { try { await api("/projects/" + id, { method: "DELETE" }); toast("Project deleted"); load(); } catch (x) { toast(x.message, 1); } }
});
$("#invl").addEventListener("click", async e => {
  const id = e.target.closest("[data-id]")?.dataset.id, acc = e.target.matches("[data-acc]"); if (!id || !(acc || e.target.matches("[data-dec]"))) return;
  try { const r = await api(`/invites/${id}/${acc ? "accept" : "decline"}`, { method: "POST" }); toast(r.message); await Promise.all([load(), loadInvites()]); invBadge(); } catch (x) { toast(x.message, 1); }
});
load(); loadInvites();
