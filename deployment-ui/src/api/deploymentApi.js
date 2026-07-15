import axios from "axios";

const deploymentApi = axios.create({
    baseURL: "/api/deployment",
    headers: {
        "Content-Type": "application/json"
    }
});

export default deploymentApi;