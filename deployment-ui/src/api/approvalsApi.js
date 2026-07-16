import axios from "axios";

const approvalsApi = axios.create({

    baseURL: "/api/approvals"

});

export default approvalsApi;
