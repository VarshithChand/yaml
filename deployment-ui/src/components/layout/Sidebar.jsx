import { useState } from "react";

import useNavigation from "../../hooks/useNavigation";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";

import {
    DashboardIcon,
    DeployIcon,
    ApprovalsIcon,
    StorageIcon,
    AnalyticsIcon,
    TimelineIcon,
    HistoryIcon,
    TemplatesIcon,
    SettingsIcon,
    ChevronIcon,
    SunIcon,
    MoonIcon
} from "./SidebarIcons";

const TABS = [
    { key: "dashboard", label: "Dashboard", Icon: DashboardIcon },
    { key: "deploy", label: "Deploy", Icon: DeployIcon },
    { key: "approvals", label: "Approvals", Icon: ApprovalsIcon },
    { key: "storage", label: "Artifacts & Images", Icon: StorageIcon },
    { key: "analytics", label: "Analytics", Icon: AnalyticsIcon },
    { key: "timeline", label: "Timeline", Icon: TimelineIcon },
    { key: "history", label: "History", Icon: HistoryIcon },
    { key: "templates", label: "Template Tester", Icon: TemplatesIcon },
    { key: "settings", label: "Settings", Icon: SettingsIcon }
];

const STORAGE_KEY = "sidebar-collapsed";

// Left-hand persistent nav, collapsed to icons-only by default (matches
// the reference the user pointed at — Google Keep's own left rail) with a
// small arrow to pull it open, rather than a hamburger button that hides
// the nav behind a dropdown. Settings lives as the last nav item rather
// than only being reachable through the account badge in TopBar.
export default function Sidebar() {

    const { tab, setTab } = useNavigation();
    const { user, tokenOwner, canApproveReleases } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [collapsed, setCollapsed] = useState(() => {

        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === null ? true : stored === "true";

    });

    const visibleTabs = TABS.filter((t) => t.key !== "approvals" || canApproveReleases);

    const avatarUrl = user?.avatarUrl || tokenOwner?.avatarUrl || "";
    const displayName = user?.login || tokenOwner?.login || "";

    function toggleCollapsed() {

        setCollapsed((prev) => {

            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;

        });

    }

    return (

        <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>

            <div className="app-sidebar-head">

                <div className="app-sidebar-avatar" title={displayName || "Not signed in"}>

                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" />
                    ) : (
                        <span>{displayName ? displayName[0].toUpperCase() : "?"}</span>
                    )}

                </div>

                <button
                    type="button"
                    className="app-sidebar-toggle"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                    title={collapsed ? "Expand navigation" : "Collapse navigation"}
                >
                    <ChevronIcon direction={collapsed ? "right" : "left"} />
                </button>

            </div>

            <nav className="app-sidebar-nav">

                {visibleTabs.map(({ key, label, Icon }) => (

                    <button
                        key={key}
                        type="button"
                        className={`app-sidebar-item ${tab === key ? "active" : ""}`}
                        onClick={() => setTab(key)}
                        title={collapsed ? label : undefined}
                    >
                        <span className="app-sidebar-item-icon"><Icon /></span>
                        <span className="app-sidebar-item-label">{label}</span>
                    </button>

                ))}

            </nav>

            <div className="app-sidebar-footer">

                <button
                    type="button"
                    className="app-sidebar-item"
                    onClick={toggleTheme}
                    title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
                >
                    <span className="app-sidebar-item-icon">
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </span>
                    <span className="app-sidebar-item-label">
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                </button>

            </div>

        </aside>

    );

}
