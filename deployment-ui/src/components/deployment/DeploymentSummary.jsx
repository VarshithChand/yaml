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
    inputValues

}) {

    const showInputs = mode !== "CI";

    return (

        <div className="card">

            <h2 className="card-title">

                Deployment Summary

            </h2>

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

    );

}
