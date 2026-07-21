// Shared between InviteCollaborator, AccessLevels and BranchManager — GitHub's
// own five collaborator permission levels, least to most access, mapped
// one-to-one onto the app's five badge colors so the level itself is
// visually segregated at a glance, not just labeled in text.
export const PERMISSION_LEVELS = [
    { value: "pull", label: "Read", badge: "badge-success", description: "View and clone only — no changes." },
    { value: "triage", label: "Triage", badge: "badge-info", description: "Manage issues and pull requests — no code changes." },
    { value: "push", label: "Write", badge: "badge-secondary", description: "Push commits and open pull requests — GitHub's standard collaborator level." },
    { value: "maintain", label: "Maintain", badge: "badge-warning", description: "Manage the repository without admin — merge, manage some settings." },
    { value: "admin", label: "Admin", badge: "badge-danger", description: "Full control, including settings, collaborators, and deleting the repository." }
];

export function levelInfo(permission) {
    return PERMISSION_LEVELS.find((l) => l.value === permission)
        || { value: permission, label: permission || "Unknown", badge: "badge-secondary", description: "" };
}
