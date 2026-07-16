import { useState } from "react";

import usePolling from "../../hooks/usePolling";
import { getWorkflowRuns } from "../../services/historyService";
import StatusBadge from "../StatusBadge";

export default function RecentDeployments() {

    const [runs, setRuns] = useState([]);

    async function loadRuns() {

        const data = await getWorkflowRuns();

        setRuns(Array.isArray(data) ? data.slice(0, 5) : []);

    }

    usePolling(loadRuns, 5000);

    return (

        <div className="card">

            <h2 className="card-title">

                Recent Deployments

            </h2>

            {

                runs.length === 0

                    ? (

                        <p className="empty-state">

                            No deployments yet.

                        </p>

                    )

                    : (

                        <div className="table-scroll">

                        <table className="table">

                            <thead>

                                <tr>

                                    <th>Status</th>
                                    <th>Branch</th>
                                    <th>Workflow</th>
                                    <th>Time</th>

                                </tr>

                            </thead>

                            <tbody>

                                {runs.map((run) => (

                                    <tr key={run.id}>

                                        <td>

                                            <StatusBadge status={run.conclusion || run.status} />

                                        </td>

                                        <td>{run.branch || "-"}</td>

                                        <td>{run.name || "-"}</td>

                                        <td>{new Date(run.createdAt).toLocaleString()}</td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                        </div>

                    )

            }

        </div>

    );

}
