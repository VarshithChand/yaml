// The single template every page renders through — same title/content
// structure, below the persistent TopBar rendered once in App.jsx.
export default function PageLayout({ title, children }) {

    return (

        <div className="main">

            {title && (

                <h1 className="page-title">
                    {title}
                </h1>

            )}

            {children}

        </div>

    );

}
