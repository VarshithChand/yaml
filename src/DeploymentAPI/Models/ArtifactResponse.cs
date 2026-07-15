using System.Text.Json.Serialization;

namespace DeploymentAPI.Models;

public class ArtifactResponse
{
    [JsonPropertyName("artifacts")]
    public List<ArtifactInfo> Artifacts { get; set; } = new();
}