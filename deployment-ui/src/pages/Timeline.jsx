import { useState } from "react";

import usePolling from "../hooks/usePolling";
import { getWorkflowRuns } from "../services/historyService";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/layout/PageLayout";

function dotClass(run) {

    if (run.status !== "completed") {
        return run.status === "in_progress" ? "timeline-dot-in_progress" : "timeline-dot-queued";
    }

    return run.conclusion === "success" ? "timeline-dot-success" : "timeline-dot-failure";

}

function statusLabel(run) {

    if (run.status !== "completed") {
        return run.status === "in_progress" ? "Running" : "Queued";
    }

    return run.conclusion === "success" ? "Succeeded" : "Failed";

}

export default function Timeline() {

    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    async function load() {

        const data = await getWorkflowRuns();
        setRuns(Array.isArray(data) ? data : []);
        setLoading(false);

    }

    // 30s — GitHub's anonymous rate limit is only 60 requests/hour, and this
    // polls continuously for as long as the Timeline page stays open.
    usePolling(load, 30000);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (

        <PageLayout title="Deployment Timeline">

            <div className="card">

                {runs.length === 0 ? (

                    <p className="empty-state">No deployments yet.</p>

                ) : (

                    <div className="timeline">

                        {runs.map((run) => (

                            <div className="timeline-item" key={run.id}>

                                <span className={`timeline-dot ${dotClass(run)}`} />

                                <div className="timeline-title">
                                    {run.name || "Deployment"} on {run.branch}
                                </div>

                                <div className="timeline-meta">
                                    {statusLabel(run)} · {run.triggeredBy || "unknown"} · {new Date(run.createdAt).toLocaleString()}
                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </PageLayout>

    );

}
