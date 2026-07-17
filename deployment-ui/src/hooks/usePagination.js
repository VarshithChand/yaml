import { useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

// Plain client-side pagination over an already-fetched array — every list
// this feeds (artifacts, container images, deployment history) is already
// pulled in full from the API, so slicing it in the browser is simpler
// than adding server-side page params for what's realistically a few
// hundred rows at most.
export default function usePagination(items, pageSize = DEFAULT_PAGE_SIZE) {

    const [page, setPage] = useState(1);

    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

    // A delete, a fresh (shorter) fetch, or a page-size change can leave
    // the current page pointing past the new end — snap back rather than
    // rendering an empty page.
    useEffect(() => {

        if (page > pageCount) setPage(1);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageCount]);

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, items.length);
    const pageItems = items.slice(startIndex, endIndex);

    return {
        page,
        setPage,
        pageCount,
        pageItems,
        totalCount: items.length,
        startIndex,
        endIndex
    };

}
