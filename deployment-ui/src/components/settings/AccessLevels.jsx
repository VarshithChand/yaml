import { Fragment, useEffect, useMemo, useState } from "react";

import useToast from "../../hooks/useToast";
import usePagination from "../../hooks/usePagination";
import Pagination from "../common/Pagination";
import SearchBox from "../common/SearchBox";
import InviteCollaborator from "./InviteCollaborator";

import { getAccessEntries, inviteCollaborator, removeCollaborator, updateInvitation, removeInvitation, assignUserToRepo } from "../../services/accessService";
import { getAccountRepositories } from "../../services/githubService";
import { getSettings } from "../../services/settingsService";
import { PERMISSION_LEVELS, levelInfo } from "./permissionLevels";

export default function AccessLevels() {

    const toast = useToast();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [busyLogin, setBusyLogin] = useState(null);

    const [showInvite, setShowInvite] = useState(false);

    // "Assign to another repo" — one row's panel open at a time.
    const [assigningLogin, setAssigningLogin] = useState(null);
    const [otherRepos, setOtherRepos] = useState(null);
    const [loadingOtherRepos, setLoadingOtherRepos] = useState(false);
    const [assignRepo, setAssignRepo] = useState("");
    const [assignPermission, setAssignPermission] = useState("push");
    const [assigning, setAssigning] = useState(false);

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

    async function openAssignPanel(login) {

        if (assigningLogin === login) {
            setAssigningLogin(null);
            return;
        }

        setAssigningLogin(login);
        setAssignPermission("push");

        if (otherRepos === null) {

            try {

                setLoadingOtherRepos(true);

                const [reposResponse, settings] = await Promise.all([
                    getAccountRepositories(),
                    getSettings()
                ]);

                const currentFullName = settings.gitHubOwner && settings.gitHubRepository
                    ? `${settings.gitHubOwner}/${settings.gitHubRepository}`.toLowerCase()
                    : null;

                const all = Array.isArray(reposResponse.data) ? reposResponse.data : [];

                // "Assign to another repo" — the currently-configured repo
                // isn't "another" one, so it's excluded rather than shown
                // as a confusing no-op option.
                const repos = currentFullName
                    ? all.filter((r) => r.fullName.toLowerCase() !== currentFullName)
                    : all;

                setOtherRepos(repos);
                setAssignRepo(repos[0]?.fullName || "");

            }
            catch (err) {

                console.error(err);
                toast.show("Unable to load this account's other repositories.", "error");
                setOtherRepos([]);

            }
            finally {

                setLoadingOtherRepos(false);

            }

        }
        else {

            setAssignRepo(otherRepos[0]?.fullName || "");

        }

    }

    async function handleAssign(login) {

        const repo = (otherRepos || []).find((r) => r.fullName === assignRepo);

        if (!repo) {
            toast.show("Pick a repository to assign this user to.", "error");
            return;
        }

        try {

            setAssigning(true);

            await assignUserToRepo(login, repo.owner, repo.name, assignPermission);

            toast.show(`Assigned ${login} to ${repo.fullName} as ${levelInfo(assignPermission).label}.`, "success");
            setAssigningLogin(null);

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to assign ${login} to ${repo.fullName}.`, "error");

        }
        finally {

            setAssigning(false);

        }

    }

    const {
        page, setPage, pageCount, pageItems, totalCount, startIndex, endIndex
    } = usePagination(filtered, 10);

    return (

        <div className="card">

            <div className="access-panel-header">

                <h2 className="card-title">
                    Access Levels
                </h2>

                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowInvite((prev) => !prev)}
                >
                    {showInvite ? "Cancel" : "+ Invite"}
                </button>

            </div>

            {showInvite && (

                <InviteCollaborator onInvited={() => { setShowInvite(false); load(); }} />

            )}

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

                            <Fragment key={`${entry.status}-${entry.login}`}>

                            <tr>

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
                                    <div className="access-row-actions">

                                        {entry.status === "active" && (

                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openAssignPanel(entry.login)}
                                            >
                                                {assigningLogin === entry.login ? "Close" : "Assign"}
                                            </button>

                                        )}

                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemove(entry)}
                                            disabled={busyLogin === entry.login}
                                        >
                                            {entry.status === "pending" ? "Cancel" : "Remove"}
                                        </button>

                                    </div>
                                </td>

                            </tr>

                            {assigningLogin === entry.login && (

                                <tr key={`${entry.login}-assign`}>
                                    <td colSpan={4}>

                                        <div className="access-assign-panel">

                                            {loadingOtherRepos ? (

                                                <p className="field-hint">Loading this account's repositories...</p>

                                            ) : (otherRepos || []).length === 0 ? (

                                                <p className="field-hint">No other repositories found for this account.</p>

                                            ) : (

                                                <div className="access-invite-controls">

                                                    <select
                                                        className="form-control"
                                                        value={assignRepo}
                                                        onChange={(e) => setAssignRepo(e.target.value)}
                                                    >
                                                        {otherRepos.map((r) => (
                                                            <option key={r.fullName} value={r.fullName}>
                                                                {r.fullName}{r.private ? " (private)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        className="form-control access-permission-select"
                                                        value={assignPermission}
                                                        onChange={(e) => setAssignPermission(e.target.value)}
                                                    >
                                                        {PERMISSION_LEVELS.map((level) => (
                                                            <option key={level.value} value={level.value}>{level.label}</option>
                                                        ))}
                                                    </select>

                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleAssign(entry.login)}
                                                        disabled={assigning}
                                                    >
                                                        {assigning ? "Assigning..." : `Assign ${entry.login}`}
                                                    </button>

                                                </div>

                                            )}

                                        </div>

                                    </td>
                                </tr>

                            )}

                            </Fragment>

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
