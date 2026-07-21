namespace DeploymentAPI.DTOs;

// A unified shape for the TopBar notification bell — a commit and a
// workflow run are different things with different fields, but the bell
// just needs "something happened, here's what, when, and by whom."
public class ActivityEventDto
{
    // "commit" or "workflow"
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Detail { get; set; } = string.Empty;

    public string Actor { get; set; } = string.Empty;

    public string ActorAvatarUrl { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }

    public string HtmlUrl { get; set; } = string.Empty;
}
