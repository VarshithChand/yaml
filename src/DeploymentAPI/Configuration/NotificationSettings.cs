namespace DeploymentAPI.Configuration;

public class NotificationSettings
{
    public SlackSettings Slack { get; set; } = new();

    public TeamsSettings Teams { get; set; } = new();

    public EmailSettings Email { get; set; } = new();
}

public class SlackSettings
{
    public string WebhookUrl { get; set; } = string.Empty;
}

public class TeamsSettings
{
    public string WebhookUrl { get; set; } = string.Empty;
}

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string From { get; set; } = string.Empty;

    public string To { get; set; } = string.Empty;
}
