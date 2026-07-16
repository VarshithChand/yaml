namespace DeploymentAPI.DTOs;

public class ApprovalDecisionDto
{
    public long RunId { get; set; }

    public List<long> EnvironmentIds { get; set; } = new();

    // true = approve, false = reject — a plain bool keeps the request body
    // simple; GitHub itself wants the string "approved"/"rejected".
    public bool Approve { get; set; }

    public string? Comment { get; set; }
}
