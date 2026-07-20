import logsApi from "../api/logsApi";

export const getLogs = async () => {
    return await logsApi.get("/");
};
