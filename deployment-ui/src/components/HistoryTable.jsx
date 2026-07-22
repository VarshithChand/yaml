import StatusBadge from "./StatusBadge";
import usePagination from "../hooks/usePagination";
import Pagination from "./common/Pagination";
import CopyButton from "./common/CopyButton";

export default function HistoryTable({ runs = [] }) {

    const safeRuns = Array.isArray(runs) ? runs : [];
    const { page, setPage, pageCount, pageItems, totalCount, startIndex, endIndex } = usePagination(safeRuns, 15);

    return (

        <div className="card">

            <h2 className="card-title">

                Deployment History

            </h2>

            <div className="table-scroll">

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

                    {pageItems.map((run) => (

                        <tr key={run.id}>

                            <td>
                                {run.id}
                                <CopyButton value={run.id} label="Copy run ID" />
                            </td>

                            <td>{run.name}</td>

                            <td>{run.branch}</td>

                            <td>

                                <StatusBadge status={run.status} />

                            </td>

                            <td>
                                {run.conclusion
                                    ? <StatusBadge status={run.conclusion} />
                                    : "-"}
                            </td>

                            <td>{run.triggeredBy}</td>

                            <td>

                                {new Date(run.createdAt).toLocaleString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            </div>

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