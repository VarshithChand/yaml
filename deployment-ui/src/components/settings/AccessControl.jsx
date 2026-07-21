import { useEffect, useState } from "react";

import useToast from "../../hooks/useToast";
import usePagination from "../../hooks/usePagination";
import Pagination from "../common/Pagination";

import {
    getCollaborators,
    inviteCollaborator,
    removeCollaborator,
    getBranchAccess,
    saveBranchPurpose,
    setBranchRestriction,
    removeBranchRestriction
} from "../../services/accessService";

// GitHub's own five collaborator permission levels, least to most access —
// mapped one-to-one onto the app's five badge colors so the level itself is
// visually segregated at a glance, not just labeled in text.
const PERMISSION_LEVELS = [
    { value: "pull", label: "Read", badge: "badge-success", description: "View and clone only — no changes." },
    { value: "triage", label: "Triage", badge: "badge-info", description: "Manage issues and pull requests — no code changes." },
    { value: "push", label: "Write", badge: "badge-secondary", description: "Push commits and open pull requests — GitHub's standard collaborator level." },
    { value: "maintain", label: "Maintain", badge: "badge-warning", description: "Manage the repository without admin — merge, manage some settings." },
    { value: "admin", label: "Admin", badge: "badge-danger", description: "Full control, including settings, collaborators, and deleting the repository." }
];

function levelInfo(permission) {
    return PERMISSION_LEVELS.find((l) => l.value === permission)
        || { value: permission, label: permission || "Unknown", badge: "badge-secondary", description: "" };
}

export default function AccessControl() {

    const toast = useToast();

    const [collaborators, setCollaborators] = useState([]);
    const [loadingCollaborators, setLoadingCollaborators] = useState(true);

    const [inviteUsername, setInviteUsername] = useState("");
    const [invitePermission, setInvitePermission] = useState("push");
    const [inviting, setInviting] = useState(false);
    const [removingUser, setRemovingUser] = useState(null);

    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [purposeDrafts, setPurposeDrafts] = useState({});
    const [savingPurpose, setSavingPurpose] = useState(null);
    const [restrictionDrafts, setRestrictionDrafts] = useState({});
    const [savingRestriction, setSavingRestriction] = useState(null);
    const [expandedBranch, setExpandedBranch] = useState(null);

    async function loadCollaborators() {

        try {

            const response = await getCollaborators();
            setCollaborators(Array.isArray(response.data) ? response.data : []);

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Unable to load collaborators.", "error");

        }
        finally {

            setLoadingCollaborators(false);

        }

    }

    async function loadBranches() {

        try {

            const response = await getBranchAccess();
            const data = Array.isArray(response.data) ? response.data : [];

            setBranches(data);
            setPurposeDrafts(Object.fromEntries(data.map((b) => [b.name, b.purpose || ""])));
            setRestrictionDrafts(Object.fromEntries(data.map((b) => [b.name, b.allowedUsers || []])));

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || "Unable to load branches.", "error");

        }
        finally {

            setLoadingBranches(false);

        }

    }

    useEffect(() => {

        loadCollaborators();
        loadBranches();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleInvite() {

        const username = inviteUsername.trim();

        if (!username) {
            toast.show("Enter a GitHub username to invite.", "error");
            return;
        }

        try {

            setInviting(true);

            const response = await inviteCollaborator(username, invitePermission);
            setCollaborators(Array.isArray(response.data) ? response.data : []);
            setInviteUsername("");

            toast.show(`Invited ${username} as ${levelInfo(invitePermission).label}.`, "success");

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to invite ${username}.`, "error");

        }
        finally {

            setInviting(false);

        }

    }

    async function handleChangePermission(username, permission) {

        try {

            const response = await inviteCollaborator(username, permission);
            setCollaborators(Array.isArray(response.data) ? response.data : []);

            toast.show(`${username}'s access set to ${levelInfo(permission).label}.`, "success");

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to update ${username}'s access.`, "error");

        }

    }

    async function handleRemove(username) {

        if (!window.confirm(`Remove ${username} from this repository? They'll lose all access immediately.`)) {
            return;
        }

        try {

            setRemovingUser(username);

            const response = await removeCollaborator(username);
            setCollaborators(Array.isArray(response.data) ? response.data : []);

            toast.show(`Removed ${username}.`, "success");

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to remove ${username}.`, "error");

        }
        finally {

            setRemovingUser(null);

        }

    }

    async function handleSavePurpose(branch) {

        try {

            setSavingPurpose(branch);

            await saveBranchPurpose(branch, purposeDrafts[branch] || "");

            toast.show(`Purpose saved for '${branch}'.`, "success");

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to save purpose for '${branch}'.`, "error");

        }
        finally {

            setSavingPurpose(null);

        }

    }

    function toggleRestrictedUser(branch, username) {

        setRestrictionDrafts((prev) => {

            const current = prev[branch] || [];

            const next = current.includes(username)
                ? current.filter((u) => u !== username)
                : [...current, username];

            return { ...prev, [branch]: next };

        });

    }

    async function handleSaveRestriction(branch) {

        const usernames = restrictionDrafts[branch] || [];

        if (usernames.length === 0) {
            toast.show("Select at least one collaborator to restrict pushes to.", "error");
            return;
        }

        try {

            setSavingRestriction(branch);

            await setBranchRestriction(branch, usernames);

            toast.show(`Push access on '${branch}' restricted to ${usernames.length} user(s).`, "success");
            loadBranches();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to restrict '${branch}'.`, "error");

        }
        finally {

            setSavingRestriction(null);

        }

    }

    async function handleRemoveRestriction(branch) {

        if (!window.confirm(`Remove the push restriction on '${branch}'? Anyone with write access will be able to push again.`)) {
            return;
        }

        try {

            setSavingRestriction(branch);

            await removeBranchRestriction(branch);

            toast.show(`Push restriction removed from '${branch}'.`, "success");
            loadBranches();

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to remove restriction on '${branch}'.`, "error");

        }
        finally {

            setSavingRestriction(null);

        }

    }

    const {
        page: collabPage,
        setPage: setCollabPage,
        pageCount: collabPageCount,
        pageItems: collabPageItems,
        totalCount: collabTotalCount,
        startIndex: collabStartIndex,
        endIndex: collabEndIndex
    } = usePagination(collaborators, 10);

    return (

        <>

        <div className="card">

            <h2 className="card-title">
                Collaborators &amp; Access Levels
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Invite a GitHub user to this repository, or change/remove an existing collaborator's
                access. Levels come straight from GitHub, least to most access:
            </p>

            <div className="access-level-legend">

                {PERMISSION_LEVELS.map((level) => (

                    <div key={level.value} className="access-level-legend-item">
                        <span className={`badge ${level.badge}`}>{level.label}</span>
                        <span>{level.description}</span>
                    </div>

                ))}

            </div>

            <div className="form-group">

                <label>Invite a collaborator</label>

                <div className="access-invite-controls">

                    <input
                        type="text"
                        className="form-control"
                        placeholder="GitHub username"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        autoComplete="off"
                    />

                    <select
                        className="form-control access-permission-select"
                        value={invitePermission}
                        onChange={(e) => setInvitePermission(e.target.value)}
                    >
                        {PERMISSION_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                    </select>

                    <button className="btn btn-primary" onClick={handleInvite} disabled={inviting}>
                        {inviting ? "Inviting..." : "Invite"}
                    </button>

                </div>

            </div>

            {loadingCollaborators ? (

                <p className="field-hint">Loading collaborators...</p>

            ) : collaborators.length === 0 ? (

                <p className="empty-state">No direct collaborators on this repository yet.</p>

            ) : (

                <>

                <div className="table-scroll">

                <table className="table">

                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Access Level</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>

                        {collabPageItems.map((c) => (

                            <tr key={c.login}>

                                <td>
                                    <div className="access-user-cell">
                                        {c.avatarUrl && <img src={c.avatarUrl} alt="" className="access-user-avatar" />}
                                        <span>{c.login}</span>
                                    </div>
                                </td>

                                <td>
                                    <select
                                        className="form-control access-permission-select"
                                        value={c.permission}
                                        onChange={(e) => handleChangePermission(c.login, e.target.value)}
                                    >
                                        {PERMISSION_LEVELS.map((level) => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleRemove(c.login)}
                                        disabled={removingUser === c.login}
                                    >
                                        {removingUser === c.login ? "Removing..." : "Remove"}
                                    </button>
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

                </div>

                <Pagination
                    page={collabPage}
                    pageCount={collabPageCount}
                    totalCount={collabTotalCount}
                    startIndex={collabStartIndex}
                    endIndex={collabEndIndex}
                    onPageChange={setCollabPage}
                />

                </>

            )}

        </div>

        <div className="card">

            <h2 className="card-title">
                Branches
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Note what each branch is for, and optionally restrict who can push to it. GitHub only
                enforces push restrictions on organization-owned repositories — on a personal account
                it rejects the request, and the error will say so.
            </p>

            {loadingBranches ? (

                <p className="field-hint">Loading branches...</p>

            ) : branches.length === 0 ? (

                <p className="empty-state">No branches found.</p>

            ) : (

                <div className="access-branch-list">

                    {branches.map((b) => (

                        <div className="access-branch-item" key={b.name}>

                            <div className="access-branch-header">

                                <span className="access-branch-name">{b.name}</span>

                                {b.restricted ? (
                                    <span className="badge badge-warning">Restricted ({b.allowedUsers.length})</span>
                                ) : (
                                    <span className="badge badge-secondary">Open</span>
                                )}

                                {b.purpose && (
                                    <span className="access-branch-purpose-preview">{b.purpose}</span>
                                )}

                                <button
                                    type="button"
                                    className="access-branch-toggle"
                                    onClick={() => setExpandedBranch(expandedBranch === b.name ? null : b.name)}
                                >
                                    {expandedBranch === b.name ? "Hide" : "Manage"}
                                </button>

                            </div>

                            {expandedBranch === b.name && (

                                <div className="access-branch-body">

                                    <div className="form-group">

                                        <label>Purpose</label>

                                        <div className="access-invite-controls">

                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="What is this branch for?"
                                                value={purposeDrafts[b.name] ?? ""}
                                                onChange={(e) => setPurposeDrafts((prev) => ({ ...prev, [b.name]: e.target.value }))}
                                            />

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleSavePurpose(b.name)}
                                                disabled={savingPurpose === b.name}
                                            >
                                                {savingPurpose === b.name ? "Saving..." : "Save"}
                                            </button>

                                        </div>

                                    </div>

                                    <div className="form-group">

                                        <label>Restrict who can push</label>

                                        {collaborators.length === 0 ? (

                                            <p className="field-hint">
                                                Invite at least one collaborator above before restricting push access.
                                            </p>

                                        ) : (

                                            <div className="access-restrict-checklist">

                                                {collaborators.map((c) => (

                                                    <label key={c.login} className="access-restrict-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={(restrictionDrafts[b.name] || []).includes(c.login)}
                                                            onChange={() => toggleRestrictedUser(b.name, c.login)}
                                                        />
                                                        {c.login}
                                                    </label>

                                                ))}

                                            </div>

                                        )}

                                        <div className="button-row">

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleSaveRestriction(b.name)}
                                                disabled={savingRestriction === b.name}
                                            >
                                                {savingRestriction === b.name ? "Saving..." : "Save Restriction"}
                                            </button>

                                            {b.restricted && (

                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleRemoveRestriction(b.name)}
                                                    disabled={savingRestriction === b.name}
                                                >
                                                    Remove Restriction
                                                </button>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>

        </>

    );

}
