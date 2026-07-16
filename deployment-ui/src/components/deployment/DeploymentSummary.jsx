import StatusBadge from "../StatusBadge";
import formatBytes from "../../utils/formatBytes";

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

            <div className="table-scroll">

            <table className="table">

                <tbody>

                    <tr>

                        <td><strong>Mode</strong></td>

                        <td>

                            <span className={`badge ${showInputs ? "badge-info" : "badge-secondary"}`}>
                                {mode}
                            </span>

                        </td>

                    </tr>

                    <tr>

                        <td><strong>Branch</strong></td>

                        <td>

                            {branch || "-"}

                        </td>

                    </tr>

                    <tr>

                        <td><strong>Workflow</strong></td>

                        <td>

                            {workflow || "-"}

                        </td>

                    </tr>

                    {showInputs && (workflowInputs || []).map((input) => (

                        <tr key={input.name}>

                            <td><strong>{formatInputLabel(input.name)}</strong></td>

                            <td>

                                {formatInputValue(input, inputValues?.[input.name])}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            </div>

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

                        <div className="table-scroll">

                        <table className="table">

                            <tbody>

                                <tr>
                                    <td><strong>Status</strong></td>
                                    <td>
                                        <StatusBadge status={run.status === "completed" ? run.conclusion : run.status} />
                                    </td>
                                </tr>

                                <tr>
                                    <td><strong>Triggered by</strong></td>
                                    <td>{run.triggeredBy || "-"}</td>
                                </tr>

                                <tr>
                                    <td><strong>When</strong></td>
                                    <td>{new Date(run.createdAt).toLocaleString()}</td>
                                </tr>

                                <tr>
                                    <td><strong>Artifact</strong></td>
                                    <td>
                                        {artifact ? artifact.name : "None produced"}
                                    </td>
                                </tr>

                                {artifact && (

                                    <tr>
                                        <td><strong>Location</strong></td>
                                        <td>
                                            {formatBytes(artifact.size)}
                                            {" — "}
                                            {artifact.expired ? (
                                                <span className="empty-state">Expired</span>
                                            ) : (
                                                <a
                                                    href={`/api/github/artifacts/${artifact.id}/download`}
                                                    className="token-help-link"
                                                >
                                                    Download →
                                                </a>
                                            )}
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                        </div>

                    )}

                </>

            )}

        </div>

    );

}
