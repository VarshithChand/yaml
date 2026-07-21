namespace DeploymentAPI.DTOs;

// A person with either accepted or pending access to the repository —
// "Status" distinguishes an invitation still waiting to be accepted from
// someone who's already a real collaborator, since GitHub treats those as
// two different kinds of object with two different sets of endpoints.
public class AccessEntryDto
{
    public string Login { get; set; } = string.Empty;

    public string AvatarUrl { get; set; } = string.Empty;

    public string Permission { get; set; } = string.Empty;

    public string Status { get; set; } = "active";

    // Only set when Status is "pending" — needed to update/cancel the
    // invitation, since GitHub keys those by invitation ID, not username.
    public long? InvitationId { get; set; }
}
