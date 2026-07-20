using DeploymentAPI.DTOs;

namespace DeploymentAPI.Services;

// In-memory only — this is a "what's happened recently" panel for the
// person running the portal, not an audit trail that needs to survive a
// restart or be queryable months later. A capped list keeps memory bounded
// without ever needing its own cleanup job.
public class ActivityLogService
{
    private const int MaxEntries = 200;

    private readonly object _lock = new();
    private readonly LinkedList<LogEntryDto> _entries = new();

    public void LogInfo(string category, string message) => Add("Info", category, message);

    public void LogError(string category, string message) => Add("Error", category, message);

    private void Add(string level, string category, string message)
    {
        lock (_lock)
        {
            _entries.AddFirst(new LogEntryDto
            {
                Timestamp = DateTime.UtcNow,
                Level = level,
                Category = category,
                Message = message
            });

            while (_entries.Count > MaxEntries)
                _entries.RemoveLast();
        }
    }

    public List<LogEntryDto> GetRecent()
    {
        lock (_lock)
        {
            return _entries.ToList();
        }
    }
}
