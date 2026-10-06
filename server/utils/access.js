/** Shared project-membership helpers (previously copy-pasted across route files). */

/** Mongo filter matching projects the user owns or belongs to. */
const memberFilter = (userId) => ({ $or: [{ owner: userId }, { members: userId }] });

/** True when `userId` (string) is the owner or a member of the (unpopulated) project document. */
const isProjectMember = (project, userId) =>
  [project.owner, ...project.members].some((id) => String(id) === String(userId));

module.exports = { memberFilter, isProjectMember };
