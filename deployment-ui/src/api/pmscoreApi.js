import axios from "axios";

// Relative path, proxied to PMSCoreAPI — see adminApi.js for why.
export default axios.create({
    baseURL: "/pmscore-api/api",
    withCredentials: true
});
