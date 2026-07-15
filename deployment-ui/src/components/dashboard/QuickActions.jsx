export default function QuickActions({

    refresh

}) {

    return (

        <div className="card dashboard-card">

            <h2 className="card-title">

                Quick Actions

            </h2>

            <button

                className="btn btn-primary"

                onClick={refresh}

            >

                Refresh Dashboard

            </button>

        </div>

    );

}