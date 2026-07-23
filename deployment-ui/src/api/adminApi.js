import axios from "axios";

// Relative path, proxied to AdminAPI by vite.config.js in dev and by
// nginx.conf in the Docker build — never called cross-origin, so AdminAPI
// itself needs no CORS configuration.
export default axios.create({
    baseURL: "/admin-api/api",
    withCredentials: true
});
