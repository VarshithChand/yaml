using System.Text;
using Docker.DotNet;
using Docker.DotNet.Models;

using DeploymentAPI.DTOs;

namespace DeploymentAPI.Services;

// Talks to the host's Docker Engine over its own HTTP API via Docker.DotNet,
// never by shelling out to the `docker` CLI. The dashboard this replicates
// (github.com/VarshithChand/docker_dashboard) builds shell commands by
// string-interpolating request input directly (e.g. `docker run --name
// {cname}`) — a straightforward command-injection hole, since a container
// name of `x; rm -rf /` runs as-is. Docker.DotNet's client sends structured
// JSON to the Engine API instead, so user input is data, never shell syntax.
public class DockerApiService
{
    private readonly DockerClient _client;

    public DockerApiService()
    {
        // /var/run/docker.sock is bind-mounted into this container by
        // docker-compose.yml — see the comment there on what that grants.
        var dockerHost = Environment.GetEnvironmentVariable("DOCKER_HOST")
            ?? "unix:///var/run/docker.sock";

        _client = new DockerClientConfiguration(new Uri(dockerHost)).CreateClient();
    }

    public async Task<List<DockerContainerDto>> ListContainersAsync()
    {
        var containers = await _client.Containers.ListContainersAsync(
            new ContainersListParameters { All = true });

        return containers.Select(c => new DockerContainerDto
        {
            Id = c.ID,
            Name = c.Names.FirstOrDefault()?.TrimStart('/') ?? c.ID[..12],
            Image = c.Image,
            State = c.State,
            Status = c.Status,
            CreatedAt = c.Created,
            Ports = c.Ports
                .Select(p => p.PublicPort > 0
                    ? $"{p.PublicPort}:{p.PrivatePort}/{p.Type}"
                    : $"{p.PrivatePort}/{p.Type}")
                .Distinct()
                .ToList()
        }).ToList();
    }

    public Task StopContainerAsync(string id) =>
        _client.Containers.StopContainerAsync(id, new ContainerStopParameters());

    public Task RestartContainerAsync(string id) =>
        _client.Containers.RestartContainerAsync(id, new ContainerRestartParameters());

    public Task RemoveContainerAsync(string id) =>
        _client.Containers.RemoveContainerAsync(id, new ContainerRemoveParameters { Force = true });

    public async Task<string> GetContainerLogsAsync(string id, int tailLines = 200)
    {
        var logsParams = new ContainerLogsParameters
        {
            ShowStdout = true,
            ShowStderr = true,
            Tail = tailLines.ToString(),
            Timestamps = false
        };

        using var stream = await _client.Containers.GetContainerLogsAsync(
            id, tty: false, logsParams, CancellationToken.None);

        using var stdout = new MemoryStream();
        using var stderr = new MemoryStream();

        await stream.CopyOutputToAsync(null, stdout, stderr, CancellationToken.None);

        var outText = Encoding.UTF8.GetString(stdout.ToArray());
        var errText = Encoding.UTF8.GetString(stderr.ToArray());

        return string.IsNullOrEmpty(errText) ? outText : $"{outText}{errText}";
    }

    public async Task<string> CreateContainerAsync(CreateDockerContainerDto request)
    {
        var exposedPorts = new Dictionary<string, EmptyStruct>();
        var portBindings = new Dictionary<string, IList<PortBinding>>();

        foreach (var mapping in request.Ports)
        {
            var parts = mapping.Split(':');
            if (parts.Length != 2) continue;

            var containerPortKey = $"{parts[1]}/tcp";
            exposedPorts[containerPortKey] = default;
            portBindings[containerPortKey] = new List<PortBinding>
            {
                new() { HostPort = parts[0] }
            };
        }

        var hostConfig = new HostConfig
        {
            PortBindings = portBindings,
            Binds = request.Volumes,
            NetworkMode = request.Network,
            RestartPolicy = new RestartPolicy
            {
                Name = request.RestartUnlessStopped
                    ? RestartPolicyKind.UnlessStopped
                    : RestartPolicyKind.No
            }
        };

        var response = await _client.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = request.Image,
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name,
            Env = request.Env,
            ExposedPorts = exposedPorts,
            HostConfig = hostConfig
        });

        await _client.Containers.StartContainerAsync(response.ID, new ContainerStartParameters());

        return response.ID;
    }

    public async Task<List<DockerEngineImageDto>> ListImagesAsync()
    {
        var images = await _client.Images.ListImagesAsync(new ImagesListParameters { All = false });

        return images.Select(i => new DockerEngineImageDto
        {
            Id = i.ID,
            Tags = (i.RepoTags ?? new List<string>()).Where(t => t != "<none>:<none>").ToList(),
            SizeBytes = i.Size,
            CreatedAt = i.Created
        }).ToList();
    }

    public Task RemoveImageAsync(string id) =>
        _client.Images.DeleteImageAsync(id, new ImageDeleteParameters { Force = true });

    public async Task<List<DockerVolumeDto>> ListVolumesAsync()
    {
        var response = await _client.Volumes.ListAsync();

        return response.Volumes.Select(v => new DockerVolumeDto
        {
            Name = v.Name,
            Driver = v.Driver,
            Mountpoint = v.Mountpoint,
            CreatedAt = DateTime.TryParse(v.CreatedAt, out var created) ? created : null
        }).ToList();
    }

    public Task CreateVolumeAsync(string name) =>
        _client.Volumes.CreateAsync(new VolumesCreateParameters { Name = name });

    public Task RemoveVolumeAsync(string name) =>
        _client.Volumes.RemoveAsync(name, force: true);

    public async Task<List<DockerNetworkDto>> ListNetworksAsync()
    {
        var networks = await _client.Networks.ListNetworksAsync();

        return networks.Select(n => new DockerNetworkDto
        {
            Id = n.ID,
            Name = n.Name,
            Driver = n.Driver,
            Scope = n.Scope
        }).ToList();
    }

    public Task CreateNetworkAsync(string name, string driver) =>
        _client.Networks.CreateNetworkAsync(new NetworksCreateParameters
        {
            Name = name,
            Driver = driver
        });

    public Task RemoveNetworkAsync(string id) =>
        _client.Networks.DeleteNetworkAsync(id);
}
