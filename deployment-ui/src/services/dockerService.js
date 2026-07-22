import api from "../api/dockerApi";

// ---------- Containers ----------

export const getContainers = async () => await api.get("/containers");

export const createContainer = async (payload) => await api.post("/containers", payload);

export const stopContainer = async (id) => await api.post(`/containers/${id}/stop`);

export const restartContainer = async (id) => await api.post(`/containers/${id}/restart`);

export const removeContainer = async (id) => await api.delete(`/containers/${id}`);

export const getContainerLogs = async (id, tail = 200) =>
    await api.get(`/containers/${id}/logs`, { params: { tail } });

// ---------- Images ----------

export const getImages = async () => await api.get("/images");

export const removeImage = async (id) => await api.delete(`/images/${id}`);

// ---------- Volumes ----------

export const getVolumes = async () => await api.get("/volumes");

export const createVolume = async (name) => await api.post("/volumes", { name });

export const removeVolume = async (name) => await api.delete(`/volumes/${name}`);

// ---------- Networks ----------

export const getNetworks = async () => await api.get("/networks");

export const createNetwork = async (name, driver) => await api.post("/networks", { name, driver });

export const removeNetwork = async (id) => await api.delete(`/networks/${id}`);
