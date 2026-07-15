import { createContext, useCallback, useEffect, useState } from "react";

import { getMe, logout as logoutRequest } from "../services/authService";
import { getSettings } from "../services/settingsService";
import useToast from "../hooks/useToast";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {

    const toast = useToast();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [oauthConfigured, setOauthConfigured] = useState(false);

    const refresh = useCallback(async () => {

        setLoading(true);
        const me = await getMe();
        setUser(me);
        setLoading(false);

    }, []);

    const refreshOauthStatus = useCallback(async () => {

        try {

            const settings = await getSettings();

            setOauthConfigured(
                !!settings.gitHubOAuthClientId && !!settings.gitHubOAuthClientSecretConfigured
            );

        }
        catch (err) {

            console.error(err);

        }

    }, []);

    useEffect(() => {

        const params = new URLSearchParams(window.location.search);
        const authError = params.get("authError");

        if (authError) {

            toast.show(
                authError === "invalid_state"
                    ? "Login session expired, please try again."
                    : "GitHub login failed.",
                "error"
            );

            params.delete("authError");
            const query = params.toString();

            window.history.replaceState(
                {},
                "",
                window.location.pathname + (query ? `?${query}` : "")
            );

        }

        refresh();
        refreshOauthStatus();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function logout() {

        await logoutRequest();
        setUser(null);

    }

    function login() {

        window.location.href = "/api/auth/github/login";

    }

    return (

        <AuthContext.Provider value={{ user, loading, login, logout, refresh, oauthConfigured, refreshOauthStatus }}>

            {children}

        </AuthContext.Provider>

    );

}
