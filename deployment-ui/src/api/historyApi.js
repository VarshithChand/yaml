import axios from "axios";

const historyApi = axios.create({

    baseURL: "/api/history"

});

export default historyApi;