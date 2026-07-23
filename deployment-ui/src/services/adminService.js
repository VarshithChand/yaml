import api from "../api/adminApi";

export const getUsers = async () => await api.get("/users");

export const createUser = async (payload) => await api.post("/users", payload);

export const updateUser = async (id, payload) => await api.put(`/users/${id}`, payload);

export const removeUser = async (id) => await api.delete(`/users/${id}`);

export const getRoles = async () => await api.get("/roles");
