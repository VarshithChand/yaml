import formatBytes from "../../utils/formatBytes";
import useAuth from "../../hooks/useAuth";
import useNavigation from "../../hooks/useNavigation";
import useToast from "../../hooks/useToast";

export default function ArtifactsTable({ artifacts = [], owner, repository, onDelete, deletingId }) {

    const { githubTokenConfigured } = useAuth();
    const { setTab } = useNavigation();
    const toast = useToast();

    function handleDeleteClick(artifact) {

        if (!githubTokenConfigured) {

            toast.show(
                "A GitHub Personal Access Token is required to delete artifacts. Add one in Settings.",
                "error"
            );

            setTab("settings");
            return;

        }

        onDelete(artifact);

    }

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
                            <th>Delete</th>
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

                                <td>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: "6px 14px", fontSize: "13px" }}
                                        disabled={deletingId === artifact.id}
                                        onClick={() => handleDeleteClick(artifact)}
                                    >
                                        {deletingId === artifact.id ? "Deleting..." : "Delete"}
                                    </button>
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
