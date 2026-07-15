import { createContext, useState } from "react";

export const NavigationContext = createContext();

export default function NavigationProvider({ children }) {

    const [tab, setTab] = useState("dashboard");
    const [pendingRepoUrl, setPendingRepoUrl] = useState(null);

    function goToSettingsWithRepo(url) {

        setPendingRepoUrl(url);
        setTab("settings");

    }

    return (

        <NavigationContext.Provider
            value={{ tab, setTab, pendingRepoUrl, setPendingRepoUrl, goToSettingsWithRepo }}
        >

            {children}

        </NavigationContext.Provider>

    );

}
