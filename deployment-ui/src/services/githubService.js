import api from "../api/githubApi";

export const getRepository = async () => {
    return await api.get("/repository");
};

export const getBranches = async () => {
    return await api.get("/branches");
};

export const getRateLimit = async () => {
    return await api.get("/rate-limit");
};

export const getTokenOwner = async () => {
    return await api.get("/token-owner");
};

export const getArtifacts = async () => {
    return await api.get("/artifacts");
};

export const deleteArtifact = async (id) => {
    return await api.delete(`/artifacts/${id}`);
};

export const getDockerImages = async () => {
    return await api.get("/docker-images");
};

export const getWorkflows = async () => {
    return await api.get("/workflows");
};

export const getWorkflowInputs = async (path, branch) => {
    return await api.get("/workflow-inputs", { params: { path, branch } });
};

export const getLastRun = async (workflow, branch) => {
    return await api.get("/workflows/last-run", { params: { workflow, branch } });
};