import axios from "axios";
import { API_BASE } from "./apiBase";

const deploymentApi = axios.create({
    baseURL: `${API_BASE}/api/deployment`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export default deploymentApi;