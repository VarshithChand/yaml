namespace DeploymentAPI.DTOs;

public class CommitDto
{
    public string Sha { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string AuthorAvatarUrl { get; set; } = string.Empty;

    public DateTime Date { get; set; }

    public string HtmlUrl { get; set; } = string.Empty;
}
