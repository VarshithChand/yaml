namespace DeploymentAPI.Configuration;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "DeploymentPortal";

    public string Audience { get; set; } = "DeploymentPortal";

    public int ExpiryMinutes { get; set; } = 480;
}
