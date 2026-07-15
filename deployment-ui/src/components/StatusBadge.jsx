export default function StatusBadge({ status }) {

    const value = (status || "").toLowerCase();

    let className = "badge";

    switch (value) {

        case "queued":
            className += " badge-warning";
            break;

        case "in_progress":
            className += " badge-info";
            break;

        case "completed":
        case "success":
            className += " badge-success";
            break;

        case "failure":
        case "cancelled":
        case "timed_out":
        case "startup_failure":
        case "action_required":
            className += " badge-danger";
            break;

        default:
            className += " badge-secondary";
            break;

    }

    return (

        <span className={className}>

            {status}

        </span>

    );

}