import formatBytes from "../../utils/formatBytes";

export default function ArtifactsTable({ artifacts = [], owner, repository }) {

    return (

        <div className="card">

            <h2 className="card-title">
                Workflow Artifacts
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Build outputs uploaded by GitHub Actions runs, stored under{" "}
                <strong>{owner}/{repository}</strong>.
            </p>

            {artifacts.length === 0 ? (

                <p className="empty-state">No artifacts found.</p>

            ) : (

                <div className="table-scroll">

                <table className="table">

                    <thead>

                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Download</th>
                        </tr>

                    </thead>

                    <tbody>

                        {artifacts.map((artifact) => (

                            <tr key={artifact.id}>

                                <td>{artifact.name}</td>

                                <td>{formatBytes(artifact.size)}</td>

                                <td>
                                    <span className={`badge ${artifact.expired ? "badge-danger" : "badge-success"}`}>
                                        {artifact.expired ? "Expired" : "Active"}
                                    </span>
                                </td>

                                <td>{new Date(artifact.createdAt).toLocaleString()}</td>

                                <td>
                                    {artifact.expired ? (
                                        <span className="empty-state">—</span>
                                    ) : (
                                        <a
                                            href={`/api/github/artifacts/${artifact.id}/download`}
                                            className="btn btn-secondary"
                                            style={{ padding: "6px 14px", fontSize: "13px" }}
                                        >
                                            Download
                                        </a>
                                    )}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

                </div>

            )}

        </div>

    );

}
