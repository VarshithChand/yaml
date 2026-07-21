namespace DeploymentAPI.DTOs;

public class PullRequestDto
{
    public int Number { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string AuthorAvatarUrl { get; set; } = string.Empty;

    public string HeadBranch { get; set; } = string.Empty;

    public string BaseBranch { get; set; } = string.Empty;

    public bool Draft { get; set; }

    public DateTime CreatedAt { get; set; }

    // Null means closed without merging — the only signal GitHub gives to
    // tell "merged" and "closed" apart on a state=closed listing.
    public DateTime? MergedAt { get; set; }

    public string HtmlUrl { get; set; } = string.Empty;
}
