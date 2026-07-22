// The single template every page renders through — same title/content
// structure, below the persistent TopBar rendered once in App.jsx.
// `actions` is optional — a control (e.g. a "Back" link) rendered at the
// top right of the header row, next to the title.
export default function PageLayout({ title, actions, children }) {

    return (

        <div className="main">

            {title && (

                <div className="page-header-row">

                    <h1 className="page-title">
                        {title}
                    </h1>

                    {actions && (
                        <div className="page-header-actions">
                            {actions}
                        </div>
                    )}

                </div>

            )}

            {children}

        </div>

    );

}
