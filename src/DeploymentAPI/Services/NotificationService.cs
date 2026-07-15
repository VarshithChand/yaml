using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using DeploymentAPI.Configuration;
using DeploymentAPI.DTOs;
using Microsoft.Extensions.Options;

namespace DeploymentAPI.Services;

// Best-effort fan-out to whichever channels have a webhook/SMTP config set.
// A channel with blank config is treated as disabled, not an error.
public class NotificationService
{
    private readonly NotificationSettings _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IOptions<NotificationSettings> settings,
        IHttpClientFactory httpClientFactory,
        ILogger<NotificationService> logger)
    {
        _settings = settings.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public Task NotifyDeployTriggered(DeployDto request, long? runId)
    {
        var message =
            $"{request.Mode} triggered: *{request.Workflow}* on branch *{request.Branch}*" +
            EnvironmentSuffix(request) +
            (runId != null ? $" (run #{runId})" : "");

        return SendAll(message);
    }

    public Task NotifyDeployCompleted(DeployDto request, WorkflowDto run)
    {
        var success = run.Conclusion == "success";

        var message =
            $"{request.Mode} {(success ? "succeeded" : "failed")}: *{request.Workflow}* on branch *{request.Branch}*" +
            EnvironmentSuffix(request) +
            $" (run #{run.Id})";

        return SendAll(message);
    }

    // "Environment" is now just whichever input key a given workflow happens to
    // declare (varies per workflow), so look for a plausibly-named one instead
    // of a fixed field.
    private static string EnvironmentSuffix(DeployDto request)
    {
        var envKey = request.Inputs.Keys
            .FirstOrDefault(k => k.Contains("environ", StringComparison.OrdinalIgnoreCase));

        if (envKey == null || string.IsNullOrWhiteSpace(request.Inputs[envKey]))
            return "";

        return $", environment *{request.Inputs[envKey]}*";
    }

    private async Task SendAll(string message)
    {
        var tasks = new List<Task>();

        if (!string.IsNullOrWhiteSpace(_settings.Slack.WebhookUrl))
            tasks.Add(SafeSend(() => SendSlack(message), "Slack"));

        if (!string.IsNullOrWhiteSpace(_settings.Teams.WebhookUrl))
            tasks.Add(SafeSend(() => SendTeams(message), "Teams"));

        if (!string.IsNullOrWhiteSpace(_settings.Email.SmtpHost) && !string.IsNullOrWhiteSpace(_settings.Email.To))
            tasks.Add(SafeSend(() => SendEmail(message), "Email"));

        if (tasks.Count == 0)
        {
            _logger.LogInformation("No notification channels configured, skipping: {Message}", message);
            return;
        }

        await Task.WhenAll(tasks);
    }

    private async Task SafeSend(Func<Task> send, string channel)
    {
        try
        {
            await send();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send {Channel} notification", channel);
        }
    }

    private async Task SendSlack(string message)
    {
        var client = _httpClientFactory.CreateClient();

        var payload = JsonSerializer.Serialize(new { text = message });

        var response = await client.PostAsync(
            _settings.Slack.WebhookUrl,
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();
    }

    private async Task SendTeams(string message)
    {
        var client = _httpClientFactory.CreateClient();

        var payload = JsonSerializer.Serialize(new { text = message });

        var response = await client.PostAsync(
            _settings.Teams.WebhookUrl,
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();
    }

    private async Task SendEmail(string message)
    {
        using var client = new SmtpClient(_settings.Email.SmtpHost, _settings.Email.SmtpPort)
        {
            Credentials = new NetworkCredential(_settings.Email.Username, _settings.Email.Password),
            EnableSsl = true
        };

        using var mail = new MailMessage(
            _settings.Email.From,
            _settings.Email.To,
            "Deployment Portal Notification",
            message);

        await client.SendMailAsync(mail);
    }
}
