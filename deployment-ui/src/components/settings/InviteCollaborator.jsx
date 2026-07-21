import { useState } from "react";

import useToast from "../../hooks/useToast";
import { inviteCollaborator } from "../../services/accessService";
import { PERMISSION_LEVELS, levelInfo } from "./permissionLevels";

export default function InviteCollaborator() {

    const toast = useToast();

    const [username, setUsername] = useState("");
    const [permission, setPermission] = useState("push");
    const [inviting, setInviting] = useState(false);

    async function handleInvite() {

        const trimmed = username.trim();

        if (!trimmed) {
            toast.show("Enter a GitHub username to invite.", "error");
            return;
        }

        try {

            setInviting(true);

            await inviteCollaborator(trimmed, permission);
            setUsername("");

            toast.show(
                `Invited ${trimmed} as ${levelInfo(permission).label}. Find them under Access Levels once they've accepted.`,
                "success"
            );

        }
        catch (err) {

            console.error(err);
            toast.show(err.response?.data?.message || `Failed to invite ${trimmed}.`, "error");

        }
        finally {

            setInviting(false);

        }

    }

    return (

        <div className="card">

            <h2 className="card-title">
                Invite a Collaborator
            </h2>

            <p className="empty-state" style={{ padding: "0 0 15px", textAlign: "left" }}>
                Give a GitHub account access to this repository. GitHub emails them an invitation
                automatically — nothing further to send from here. They'll show up under{" "}
                <strong>Access Levels</strong> as "Pending" until they accept.
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

                <label>GitHub username</label>

                <div className="access-invite-controls">

                    <input
                        type="text"
                        className="form-control"
                        placeholder="GitHub username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        autoComplete="off"
                    />

                    <select
                        className="form-control access-permission-select"
                        value={permission}
                        onChange={(e) => setPermission(e.target.value)}
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

        </div>

    );

}
