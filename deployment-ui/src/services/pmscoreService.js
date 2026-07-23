import api from "../api/pmscoreApi";

export const getProjects = async () => await api.get("/projects");

export const createProject = async (payload) => await api.post("/projects", payload);

export const updateProject = async (id, payload) => await api.put(`/projects/${id}`, payload);

export const removeProject = async (id) => await api.delete(`/projects/${id}`);

export const getProjectTasks = async (projectId) => await api.get(`/projects/${projectId}/tasks`);

export const createTask = async (projectId, payload) => await api.post(`/projects/${projectId}/tasks`, payload);

export const updateTask = async (taskId, payload) => await api.put(`/tasks/${taskId}`, payload);

export const removeTask = async (taskId) => await api.delete(`/tasks/${taskId}`);
