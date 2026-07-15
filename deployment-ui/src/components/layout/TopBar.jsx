import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import Logo from "../common/Logo";

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
