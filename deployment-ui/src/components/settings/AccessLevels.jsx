import { useEffect, useMemo, useState } from "react";

import useToast from "../../hooks/useToast";
import usePagination from "../../hooks/usePagination";
import Pagination from "../common/Pagination";
import SearchBox from "../common/SearchBox";

import { getAccessEntries, inviteCollaborator, removeCollaborator, updateInvitation, removeInvitation } from "../../services/accessService";
import { PERMISSION_LEVELS, levelInfo } from "./permissionLevels";

export default function AccessLevels() {

    const toast = useToast();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [busyLogin, setBusyLogin] = useState(null);

    async function load() {

        try {

            const response = await getAccessEntries();
            setEntries(Array.isArray(response.data) ? response.data : []);

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Unable to load access entries.", "error");

        }
        finally {

            setLoading(false);

        }

    }

    useEffect(() => {

        load();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {

        const query = search.trim().toLowerCase();

        if (!query) return entries;

        return entries.filter((e) => e.login.toLowerCase().includes(query));

    }, [entries, search]);

    async function handleChangePermission(entry, permission) {

        try {

            setBusyLogin(entry.login);

            if (entry.status === "pending") {
                await updateInvitation(entry.invitationId, permission);
            }
            else {
                await inviteCollaborator(entry.login, permission);
            }

            toast.show(`${entry.login}'s access set to ${levelInfo(permission).label}. GitHub will notify them.`, "success");
            load();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to update ${entry.login}'s access.`, "error");

        }
        finally {

            setBusyLogin(null);

        }

    }

    async function handleRemove(entry) {

        const verb = entry.status === "pending" ? "Cancel the invitation for" : "Remove";

        if (!window.confirm(`${verb} ${entry.login}? ${entry.status === "pending" ? "They won't be able to accept it anymore." : "They'll lose all access immediately."}`)) {
            return;
        }

        try {

            setBusyLogin(entry.login);

            if (entry.status === "pending") {
                await removeInvitation(entry.invitationId);
            }
            else {
                await removeCollaborator(entry.login);
            }

            toast.show(`${entry.login} removed.`, "success");
            load();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to remove ${entry.login}.`, "error");

        }
        finally {

            setBusyLogin(null);

        }

    }

    const {
        page, setPage, pageCount, pageItems, totalCount, startIndex, endIndex
    } = usePagination(filtered, 10);

    return (

        <div className="card">

            <h2 className="card-title">
                Access Levels
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Everyone with access to this repository, invited or already in. Changing someone's
                level here triggers GitHub's own notification email to them — the portal doesn't
                send a separate one.
            </p>

            <SearchBox
                placeholder="Search by username..."
                value={search}
                onChange={setSearch}
            />

            {loading ? (

                <p className="field-hint">Loading access entries...</p>

            ) : entries.length === 0 ? (

                <p className="empty-state">No collaborators or pending invitations yet.</p>

            ) : filtered.length === 0 ? (

                <p className="empty-state">No matches for "{search}".</p>

            ) : (

                <>

                <div className="table-scroll">

                <table className="table">

                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Status</th>
                            <th>Access Level</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>

                        {pageItems.map((entry) => (

                            <tr key={`${entry.status}-${entry.login}`}>

                                <td>
                                    <div className="access-user-cell">
                                        {entry.avatarUrl && <img src={entry.avatarUrl} alt="" className="access-user-avatar" />}
                                        <span>{entry.login}</span>
                                    </div>
                                </td>

                                <td>
                                    <span className={`badge ${entry.status === "pending" ? "badge-warning" : "badge-success"}`}>
                                        {entry.status === "pending" ? "Pending" : "Active"}
                                    </span>
                                </td>

                                <td>
                                    <select
                                        className="form-control access-permission-select"
                                        value={entry.permission}
                                        disabled={busyLogin === entry.login}
                                        onChange={(e) => handleChangePermission(entry, e.target.value)}
                                    >
                                        {PERMISSION_LEVELS.map((level) => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleRemove(entry)}
                                        disabled={busyLogin === entry.login}
                                    >
                                        {entry.status === "pending" ? "Cancel" : "Remove"}
                                    </button>
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

                </>

            )}

        </div>

    );

}
