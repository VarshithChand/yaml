import axios from "axios";
import { API_BASE } from "./apiBase";

const approvalsApi = axios.create({

    baseURL: `${API_BASE}/api/approvals`,
    withCredentials: true

});

export default approvalsApi;
