import api from "../api/pullRequestsApi";

export const getOpenPullRequests = async (force = false) => {
    return await api.get("/", { params: force ? { force: true } : {} });
};

export const getPullRequestCount = async () => {
    return await api.get("/count");
};

export const getPullRequestHistory = async (force = false) => {
    return await api.get("/history", { params: force ? { force: true } : {} });
};

export const getRecentCommits = async (force = false) => {
    return await api.get("/commits", { params: force ? { force: true } : {} });
};

export const approvePullRequest = async (number) => {
    return await api.post(`/${number}/approve`);
};

export const mergePullRequest = async (number) => {
    return await api.post(`/${number}/merge`);
};
