import axios from "axios";
import { API_BASE } from "./apiBase";

export default axios.create({
    baseURL: `${API_BASE}/api/github`,
    withCredentials: true
});