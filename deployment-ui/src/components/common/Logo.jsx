// Icon mark matches the app's favicon (public/favicon.svg) — same glyph,
// same blue, so the tab icon and the in-app logo read as one identity.
export default function Logo({ compact = false, showEyebrow = true, size = 40 }) {

    return (

        <div className="logo-lockup">

            <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <rect width="48" height="48" rx="10" fill="#2563eb" />
                <path d="M24 8 L36 22 L28 22 L28 40 L20 40 L20 22 L12 22 Z" fill="#ffffff" />
            </svg>

            {!compact && (

                <div className="logo-text">

                    {showEyebrow && (
                        <span className="logo-eyebrow">GitHub</span>
                    )}

                    <span className="logo-title">Deployment Portal</span>

                </div>

            )}

        </div>

    );

}
