import axios from "axios";

// Relative path, proxied to SecurityAPI — see adminApi.js for why.
export default axios.create({
    baseURL: "/security-api/api",
    withCredentials: true
});
