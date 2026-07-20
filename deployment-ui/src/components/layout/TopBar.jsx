import { useState } from "react";

import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import usePolling from "../../hooks/usePolling";
import Logo from "../common/Logo";
import { getRateLimit } from "../../services/githubService";

// The slim top strip: brand mark on the left, account/theme/rate-limit
// controls on the right. Primary navigation lives in Sidebar now, not
// here — this bar only ever holds a handful of controls, so it doesn't
// need its own collapse/hamburger behavior, just normal flex-wrap.
export default function TopBar() {

    const { theme, toggleTheme } = useTheme();
    const { user, loading, login, logout, oauthConfigured, tokenOwner } = useAuth();
    const { setTab } = useNavigation();

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

            <div className="top-bar-actions">

                {!loading && (

                    user ? (

                        <div className="user-badge">

                            <button
                                type="button"
                                className="account-menu-trigger"
                                onClick={() => setTab("settings")}
                                title="Go to Settings"
                            >
                                <span>{user.login}</span>

                                <span className={`badge ${user.role === "Admin" ? "badge-success" : "badge-secondary"}`}>
                                    {user.role}
                                </span>
                            </button>

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
                                    {rateLimit.remaining}/{rateLimit.limit}
                                </span>
                            )}

                            {tokenOwner?.configured ? (

                                <button
                                    type="button"
                                    className="badge badge-success account-menu-trigger"
                                    title="GitHub Personal Access Token owner — click to go to Settings"
                                    onClick={() => setTab("settings")}
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

                            ) : (

                                <button className="theme-toggle" onClick={() => setTab("settings")}>
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

        </header>

    );

}
