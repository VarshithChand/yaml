namespace DeploymentAPI.DTOs;

public class RateLimitDto
{
    public int Limit { get; set; }

    public int Remaining { get; set; }

    public DateTime ResetAt { get; set; }
}
