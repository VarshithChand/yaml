import api from "../api/accessApi";

// Raw axios responses (not unwrapped) — same convention as githubService.js,
// since this talks to the same GitHub-backed data.

// Active collaborators only — for the branch "restrict who can push" picker.
export const getCollaborators = async (force = false) => {
    return await api.get("/collaborators", { params: force ? { force: true } : {} });
};

// Active + pending invitations combined — for the Access Levels page.
export const getAccessEntries = async (force = false) => {
    return await api.get("/entries", { params: force ? { force: true } : {} });
};

export const inviteCollaborator = async (username, permission) => {
    return await api.put(`/collaborators/${encodeURIComponent(username)}`, { permission });
};

export const removeCollaborator = async (username) => {
    return await api.delete(`/collaborators/${encodeURIComponent(username)}`);
};

export const updateInvitation = async (invitationId, permission) => {
    return await api.put(`/invitations/${invitationId}`, { permission });
};

export const removeInvitation = async (invitationId) => {
    return await api.delete(`/invitations/${invitationId}`);
};

export const createBranch = async (name, sourceBranch) => {
    return await api.post("/branches", { name, sourceBranch });
};

export const getBranchAccess = async (force = false) => {
    return await api.get("/branches", { params: force ? { force: true } : {} });
};

export const saveBranchPurpose = async (branch, purpose) => {
    return await api.put(`/branches/${encodeURIComponent(branch)}/purpose`, { purpose });
};

export const setBranchRestriction = async (branch, usernames) => {
    return await api.put(`/branches/${encodeURIComponent(branch)}/restrictions`, { usernames });
};

export const removeBranchRestriction = async (branch) => {
    return await api.delete(`/branches/${encodeURIComponent(branch)}/restrictions`);
};
