import StatusBadge from "../StatusBadge";
import formatBytes from "../../utils/formatBytes";
import { API_BASE } from "../../api/apiBase";

function formatInputLabel(name) {

    return name
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

}

function formatInputValue(input, rawValue) {

    if (input.type === "boolean" || /cluster/i.test(input.name)) {

        const enabled = rawValue === "true";

        return (
            <span className={enabled ? "status-success" : "status-failed"}>
                {enabled ? "Enabled" : "Disabled"}
            </span>
        );

    }

    return rawValue && rawValue.trim() !== "" ? rawValue : "-";

}

export default function DeploymentSummary({

    mode,
    branch,
    workflow,
    workflowInputs,
    inputValues,
    lastRun,
    lastRunLoading

}) {

    const showInputs = mode !== "CI";

    const run = lastRun?.run;
    const artifact = lastRun?.artifact;

    return (

        <div className="card">

            <h2 className="card-title">

                Deployment Summary

            </h2>

            <div className="info-row">
                <span>Mode</span>
                <strong>
                    <span className={`badge ${showInputs ? "badge-info" : "badge-secondary"}`}>
                        {mode}
                    </span>
                </strong>
            </div>

            <div className="info-row">
                <span>Branch</span>
                <strong>{branch || "-"}</strong>
            </div>

            <div className="info-row">
                <span>Workflow</span>
                <strong>{workflow || "-"}</strong>
            </div>

            {showInputs && (workflowInputs || []).map((input) => (

                <div className="info-row" key={input.name}>
                    <span>{formatInputLabel(input.name)}</span>
                    <strong>{formatInputValue(input, inputValues?.[input.name])}</strong>
                </div>

            ))}

            {workflow && (

                <>

                    <h2 className="card-title" style={{ marginTop: "20px" }}>
                        Previous Run
                    </h2>

                    {lastRunLoading && (
                        <p className="field-hint">Checking the last run for this workflow...</p>
                    )}

                    {!lastRunLoading && !run && (
                        <p className="empty-state">
                            This workflow hasn't run{branch ? ` on ${branch}` : ""} yet.
                        </p>
                    )}

                    {!lastRunLoading && run && (

                        <>

                        <div className="info-row">
                            <span>Status</span>
                            <strong>
                                <StatusBadge status={run.status === "completed" ? run.conclusion : run.status} />
                            </strong>
                        </div>

                        <div className="info-row">
                            <span>Triggered by</span>
                            <strong>{run.triggeredBy || "-"}</strong>
                        </div>

                        <div className="info-row">
                            <span>When</span>
                            <strong>{new Date(run.createdAt).toLocaleString()}</strong>
                        </div>

                        <div className="info-row">
                            <span>Artifact</span>
                            <strong>{artifact ? artifact.name : "None produced"}</strong>
                        </div>

                        {artifact && (

                            <div className="info-row">
                                <span>Location</span>
                                <strong>
                                    {formatBytes(artifact.size)}
                                    {" — "}
                                    {artifact.expired ? (
                                        <span className="empty-state">Expired</span>
                                    ) : (
                                        <a
                                            href={`${API_BASE}/api/github/artifacts/${artifact.id}/download`}
                                            className="token-help-link"
                                        >
                                            Download →
                                        </a>
                                    )}
                                </strong>
                            </div>

                        )}

                        </>

                    )}

                </>

            )}

        </div>

    );

}
