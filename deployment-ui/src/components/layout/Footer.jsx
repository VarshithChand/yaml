import Logo from "../common/Logo";

// Present on every page, same as TopBar — a persistent footer rather than
// a per-page one, so it doesn't disappear on whichever page didn't think
// to render it.
export default function Footer() {

    return (

        <footer className="app-footer">

            <div className="app-footer-inner">

                <div className="app-footer-brand">
                    <Logo compact size={22} showEyebrow={false} />
                    <span className="app-footer-title">Deployment Portal</span>
                </div>

                <p className="app-footer-tagline">
                    Internal control panel for GitHub Actions — deployments, artifacts, and
                    approvals in one place.
                </p>

                <span className="app-footer-copy">
                    &copy; {new Date().getFullYear()} Deployment Portal
                </span>

            </div>

        </footer>

    );

}
