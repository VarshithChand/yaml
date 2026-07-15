import deploymentApi from "../api/deploymentApi";

export const deploy = async (request) => {
    return await deploymentApi.post("/deploy", request);
};