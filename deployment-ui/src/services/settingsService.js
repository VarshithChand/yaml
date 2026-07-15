import settingsApi from "../api/settingsApi";

export const getSettings = async () => {
    const response = await settingsApi.get("/");
    return response.data;
};

export const saveGitHubSettings = async (payload) => {
    const response = await settingsApi.post("/github", payload);
    return response.data;
};

export const saveDockerSettings = async (payload) => {
    const response = await settingsApi.post("/docker", payload);
    return response.data;
};

export const saveGitHubOAuthSettings = async (payload) => {
    const response = await settingsApi.post("/github-oauth", payload);
    return response.data;
};

export const saveAdminUsernames = async (payload) => {
    const response = await settingsApi.post("/admins", payload);
    return response.data;
};

export const clearSettings = async (section) => {
    const response = await settingsApi.delete(`/${section}`);
    return response.data;
};

export const previewGitHubRepository = async (owner, repository) => {
    const response = await settingsApi.get("/github/preview", {
        params: { owner, repository }
    });
    return response.data;
};
