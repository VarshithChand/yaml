import axios from "axios";
import { API_BASE } from "./apiBase";

const historyApi = axios.create({

    baseURL: `${API_BASE}/api/history`,
    withCredentials: true

});

export default historyApi;