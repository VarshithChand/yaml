import { createContext, useCallback, useState } from "react";

const TABS = ["dashboard", "deploy", "approvals", "storage", "analytics", "timeline", "history", "settings"];

// Read the starting tab from the URL so a hard reload (or a bookmarked/
// shared link) lands back on the same page instead of always resetting
// to the dashboard.
function readTabFromUrl() {

    const requested = new URLSearchParams(window.location.search).get("tab");

    return TABS.includes(requested) ? requested : "dashboard";

}

export const NavigationContext = createContext();

export default function NavigationProvider({ children }) {

    const [tab, setTabState] = useState(readTabFromUrl);
    const [pendingRepoUrl, setPendingRepoUrl] = useState(null);

    const setTab = useCallback((nextTab) => {

        setTabState(nextTab);

        const url = new URL(window.location.href);

        url.searchParams.set("tab", nextTab);

        // replaceState, not pushState — switching tabs shouldn't pile up
        // browser history entries, it should just make the current page
        // reload-safe and shareable.
        window.history.replaceState(null, "", url);

    }, []);

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
