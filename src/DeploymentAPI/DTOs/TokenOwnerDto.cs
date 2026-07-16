namespace DeploymentAPI.DTOs;

// Who the configured Personal Access Token belongs to — shown in the top
// bar instead of "Set up GitHub Login" once a token is saved, so it's
// obvious whose credentials the app is acting with.
public class TokenOwnerDto
{
    public bool Configured { get; set; }

    public string Login { get; set; } = string.Empty;

    public string AvatarUrl { get; set; } = string.Empty;
}
