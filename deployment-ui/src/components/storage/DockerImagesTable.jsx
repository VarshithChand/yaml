import usePagination from "../../hooks/usePagination";
import Pagination from "../common/Pagination";

export default function DockerImagesTable({ images = [], owner }) {

    const { page, setPage, pageCount, pageItems, totalCount, startIndex, endIndex } = usePagination(images, 10);

    return (

        <div className="card">

            <h2 className="card-title">
                Container Images
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Published to GitHub Container Registry under{" "}
                <strong>ghcr.io/{owner}</strong>. Only images owned by this
                same GitHub account are visible — the configured token can't
                see packages under any other owner.
            </p>

            {images.length === 0 ? (

                <p className="empty-state">
                    No container images found — or the Personal Access Token
                    is missing the <code>read:packages</code> scope.
                </p>

            ) : (

                <div className="table-scroll">

                <table className="table">

                    <thead>

                        <tr>
                            <th>Image</th>
                            <th>Visibility</th>
                            <th>Versions</th>
                            <th>Linked Repository</th>
                            <th>Last Pushed</th>
                            <th>View</th>
                        </tr>

                    </thead>

                    <tbody>

                        {pageItems.map((image) => (

                            <tr key={image.name}>

                                <td>ghcr.io/{owner}/{image.name}</td>

                                <td>
                                    <span className={`badge ${image.visibility === "public" ? "badge-success" : "badge-secondary"}`}>
                                        {image.visibility || "unknown"}
                                    </span>
                                </td>

                                <td>{image.versionCount}</td>

                                <td>{image.repository || <span className="empty-state">—</span>}</td>

                                <td>{new Date(image.updatedAt).toLocaleString()}</td>

                                <td>
                                    <a
                                        href={image.htmlUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-secondary"
                                        style={{ padding: "6px 14px", fontSize: "13px" }}
                                    >
                                        View
                                    </a>
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

                </div>

            )}

            <Pagination
                page={page}
                pageCount={pageCount}
                totalCount={totalCount}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
            />

        </div>

    );

}
