import approvalsApi from "../api/approvalsApi";

export const getPendingApprovals = async () => {
    return await approvalsApi.get("/pending");
};

export const submitApprovalDecision = async (payload) => {
    return await approvalsApi.post("/decide", payload);
};

export const getApprovalHistory = async () => {
    return await approvalsApi.get("/history");
};
