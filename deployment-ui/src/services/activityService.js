import api from "../api/activityApi";

export const getRecentActivity = async () => {
    return await api.get("/recent");
};
