import api from "../api/securityApi";

export const getAuditLogs = async (limit = 200) => await api.get("/audit-logs", { params: { limit } });

export const getApiKeys = async () => await api.get("/api-keys");

export const createApiKey = async (name) => await api.post("/api-keys", { name });

export const revokeApiKey = async (id) => await api.delete(`/api-keys/${id}`);
