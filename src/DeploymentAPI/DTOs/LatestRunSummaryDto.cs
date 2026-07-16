namespace DeploymentAPI.DTOs;

// Shown on the Deploy page so picking a workflow surfaces what it last did,
// before you trigger it again — null Run means it's never run (for this
// branch, if one was given); null Artifact means that run produced none
// (still building, failed before upload, or only produced the internal
// publish-files hand-off).
public class LatestRunSummaryDto
{
    public WorkflowDto? Run { get; set; }

    public ArtifactDto? Artifact { get; set; }
}
