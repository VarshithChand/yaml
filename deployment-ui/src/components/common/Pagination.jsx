// Prev/Next + "Showing X-Y of Z" — the pattern GitHub, Azure DevOps, and
// most admin/console tools use for open-ended lists, rather than numbered
// page buttons (better suited to content sites with a small, bounded page
// count). Renders nothing for a single page — pagination controls with
// nothing to page between are just noise.
export default function Pagination({ page, pageCount, totalCount, startIndex, endIndex, onPageChange }) {

    if (totalCount === 0 || pageCount <= 1) return null;

    return (

        <div className="pagination">

            <span className="pagination-info">
                Showing {startIndex + 1}–{endIndex} of {totalCount}
            </span>

            <div className="pagination-controls">

                <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>

                <span className="pagination-page">Page {page} of {pageCount}</span>

                <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={page >= pageCount}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>

            </div>

        </div>

    );

}
