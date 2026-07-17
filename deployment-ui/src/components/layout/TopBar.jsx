import { useEffect, useRef, useState } from "react";

import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import usePolling from "../../hooks/usePolling";
import Logo from "../common/Logo";
import { getRateLimit } from "../../services/githubService";

const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "deploy", label: "Deploy" },
    { key: "approvals", label: "Approvals" },
    { key: "storage", label: "Artifacts & Images" },
    { key: "analytics", label: "Analytics" },
    { key: "timeline", label: "Timeline" },
    { key: "history", label: "History" },
    { key: "templates", label: "Template Tester" }
];

// The single persistent header: brand, primary nav, and account/theme
// controls all in one bar, present on every page — not a separate nav
// strip plus a per-page header that only some pages happened to render.
// Below the collapse breakpoint (see .top-bar-menu-toggle in global.css)
// the nav + actions move into a dropdown panel behind a menu button
// instead of wrapping onto extra rows in an uncontrolled way.
export default function TopBar() {

    const { theme, toggleTheme } = useTheme();
    const { user, loading, login, logout, oauthConfigured, tokenOwner, canApproveReleases } = useAuth();
    const { tab, setTab } = useNavigation();

    const [rateLimit, setRateLimit] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    // Settings lives behind the account name instead of as its own nav
    // tab — a click opens this small menu (Settings, and Logout when
    // signed in), closed by clicking anywhere outside it.
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    // The Approvals tab only makes sense for someone whose token can
    // actually approve a deployment (repo-admin access) — everyone else
    // never sees it, rather than seeing it and hitting a "no access" wall.
    const visibleTabs = TABS.filter((t) => t.key !== "approvals" || canApproveReleases);

    useEffect(() => {

        if (!accountMenuOpen) return;

        function handleOutsideClick(e) {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
                setAccountMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);

    }, [accountMenuOpen]);

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

    function handleTabClick(key) {

        setTab(key);
        setMenuOpen(false);

    }

    return (

        <header className="top-bar">

            <div className="top-bar-brand">
                <Logo showEyebrow={false} size={32} />
            </div>

            <button
                type="button"
                className="top-bar-menu-toggle"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
            >
                {menuOpen ? "✕" : "☰"}
            </button>

            <div className={`top-bar-collapsible ${menuOpen ? "open" : ""}`}>

                <nav className="app-nav">

                    {visibleTabs.map((t) => (

                        <button
                            key={t.key}
                            className={`nav-tab ${tab === t.key ? "active" : ""}`}
                            onClick={() => handleTabClick(t.key)}
                        >
                            {t.label}
                        </button>

                    ))}

                </nav>

                <div className="top-bar-actions">

                    {!loading && (

                        user ? (

                            <div className="user-badge account-menu" ref={accountMenuRef}>

                                <button
                                    type="button"
                                    className="account-menu-trigger"
                                    onClick={() => setAccountMenuOpen((open) => !open)}
                                    aria-expanded={accountMenuOpen}
                                >
                                    <span>{user.login}</span>

                                    <span className={`badge ${user.role === "Admin" ? "badge-success" : "badge-secondary"}`}>
                                        {user.role}
                                    </span>
                                </button>

                                {accountMenuOpen && (

                                    <div className="account-menu-dropdown">

                                        <button onClick={() => { handleTabClick("settings"); setAccountMenuOpen(false); }}>
                                            Settings
                                        </button>

                                        <button onClick={() => { logout(); setAccountMenuOpen(false); }}>
                                            Logout
                                        </button>

                                    </div>

                                )}

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
                                        {rateLimit.remaining}/{rateLimit.limit}
                                    </span>
                                )}

                                {tokenOwner?.configured ? (

                                    <div className="account-menu" ref={accountMenuRef}>

                                        <button
                                            type="button"
                                            className="badge badge-success account-menu-trigger"
                                            title="GitHub Personal Access Token owner — deployments and approvals run as this account"
                                            onClick={() => setAccountMenuOpen((open) => !open)}
                                            aria-expanded={accountMenuOpen}
                                        >
                                            {tokenOwner.avatarUrl && (
                                                <img
                                                    src={tokenOwner.avatarUrl}
                                                    alt=""
                                                    className="token-owner-avatar"
                                                />
                                            )}
                                            {tokenOwner.login}
                                        </button>

                                        {accountMenuOpen && (

                                            <div className="account-menu-dropdown">

                                                <button onClick={() => { handleTabClick("settings"); setAccountMenuOpen(false); }}>
                                                    Settings
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                ) : (

                                    <button className="theme-toggle" onClick={() => handleTabClick("settings")}>
                                        Set up GitHub Login
                                    </button>

                                )}

                            </div>

                        )

                    )}

                    <button className="theme-toggle" onClick={toggleTheme}>
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>

                </div>

            </div>

        </header>

    );

}
