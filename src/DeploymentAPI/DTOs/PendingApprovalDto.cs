namespace DeploymentAPI.DTOs;

// A run currently paused at a protected-environment approval gate (RC,
// Cluster01/02/03, ...) — GitHub reports this as the run's own status
// being "waiting", separate from the usual queued/in_progress/completed.
public class PendingApprovalDto
{
    public long RunId { get; set; }

    public string WorkflowName { get; set; } = string.Empty;

    public string Branch { get; set; } = string.Empty;

    public string TriggeredBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public string CommitMessage { get; set; } = string.Empty;

    public List<PendingEnvironmentDto> Environments { get; set; } = new();
}

public class PendingEnvironmentDto
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<string> Reviewers { get; set; } = new();
}
