import api from "../api/accessApi";

// Raw axios responses (not unwrapped) — same convention as githubService.js,
// since this talks to the same GitHub-backed data.

export const getCollaborators = async (force = false) => {
    return await api.get("/collaborators", { params: force ? { force: true } : {} });
};

export const inviteCollaborator = async (username, permission) => {
    return await api.put(`/collaborators/${encodeURIComponent(username)}`, { permission });
};

export const removeCollaborator = async (username) => {
    return await api.delete(`/collaborators/${encodeURIComponent(username)}`);
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
