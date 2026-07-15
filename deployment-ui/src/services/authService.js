import authApi from "../api/authApi";

export const getMe = async () => {

    try {

        const response = await authApi.get("/me");
        return response.data;

    }
    catch {

        return null;

    }

};

export const logout = async () => {

    await authApi.post("/logout");

};
