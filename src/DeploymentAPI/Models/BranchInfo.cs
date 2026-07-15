using System.Text.Json.Serialization;

namespace DeploymentAPI.Models;

public class BranchInfo
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}