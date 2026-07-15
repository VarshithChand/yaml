import StatusBadge from "./StatusBadge";

export default function HistoryTable({ runs = [] }) {

    return (

        <div className="card">

            <h2 className="card-title">

                Deployment History

            </h2>

            <table className="table">

                <thead>

                    <tr>

                        <th>Run ID</th>
                        <th>Workflow</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Conclusion</th>
                        <th>Triggered By</th>
                        <th>Created</th>

                    </tr>

                </thead>

                <tbody>

                    {(Array.isArray(runs) ? runs : []).map((run) => (

                        <tr key={run.id}>

                            <td>{run.id}</td>

                            <td>{run.name}</td>

                            <td>{run.branch}</td>

                            <td>

                                <StatusBadge status={run.status} />

                            </td>

                            <td>{run.conclusion}</td>

                            <td>{run.triggeredBy}</td>

                            <td>

                                {new Date(run.createdAt).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}