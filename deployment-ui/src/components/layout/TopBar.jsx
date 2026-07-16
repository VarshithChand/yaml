import { useState } from "react";

import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import usePolling from "../../hooks/usePolling";
import Logo from "../common/Logo";
import { getRateLimit } from "../../services/githubService";

const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "deploy", label: "Deploy" },
    { key: "storage", label: "Artifacts & Images" },
    { key: "analytics", label: "Analytics" },
    { key: "timeline", label: "Timeline" },
    { key: "history", label: "History" },
    { key: "settings", label: "Settings" }
];

// The single persistent header: brand, primary nav, and account/theme
// controls all in one bar, present on every page — not a separate nav
// strip plus a per-page header that only some pages happened to render.
export default function TopBar() {

    const { theme, toggleTheme } = useTheme();
    const { user, loading, login, logout, oauthConfigured } = useAuth();
    const { tab, setTab } = useNavigation();

    const [rateLimit, setRateLimit] = useState(null);

    async function loadRateLimit() {

        try {

            const response = await getRateLimit();
            setRateLimit(response.data);

        }
        catch (err) {

            console.error(err);

        }

    }

    // Checking /rate_limit doesn't itself consume any quota, so polling it
    // is free — this is what lets "Public view" show a live remaining count.
    // usePolling fires once immediately on mount, then on the interval.
    usePolling(loadRateLimit, 30000);

    return (

        <header className="top-bar">

            <div className="top-bar-brand">
                <Logo showEyebrow={false} size={32} />
            </div>

            <nav className="app-nav">

                {TABS.map((t) => (

                    <button
                        key={t.key}
                        className={`nav-tab ${tab === t.key ? "active" : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>

                ))}

            </nav>

            <div className="top-bar-actions">

                {!loading && (

                    user ? (

                        <div className="user-badge">

                            <span>{user.login}</span>

                            <span className={`badge ${user.role === "Admin" ? "badge-success" : "badge-secondary"}`}>
                                {user.role}
                            </span>

                            <button className="theme-toggle" onClick={logout}>
                                Logout
                            </button>

                        </div>

                    ) : oauthConfigured ? (

                        <button className="theme-toggle" onClick={login}>
                            Login with GitHub
                        </button>

                    ) : (

                        <div className="user-badge">

                            <span className="badge badge-secondary">
                                Public view
                            </span>

                            {rateLimit && (
                                <span
                                    className={`badge ${rateLimit.remaining <= 10 ? "badge-danger" : "badge-info"}`}
                                    title={`GitHub API requests remaining this hour — resets at ${new Date(rateLimit.resetAt).toLocaleTimeString()}`}
                                >
                                    {rateLimit.remaining}/{rateLimit.limit} requests
                                </span>
                            )}

                            <button className="theme-toggle" onClick={() => setTab("settings")}>
                                Set up GitHub Login
                            </button>

                        </div>

                    )

                )}

                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>

            </div>

        </header>

    );

}
