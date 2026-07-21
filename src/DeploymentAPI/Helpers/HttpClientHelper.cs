using System.Net;
using Newtonsoft.Json.Linq;

namespace DeploymentAPI.Helpers
{
    public static class HttpClientHelper
    {
        public static async Task<string> GetAsync(
            HttpClient client,
            string url)
        {
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException(await BuildFriendlyMessageAsync(response), null, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        public static async Task<string> PostAsync(
            HttpClient client,
            string url,
            HttpContent content)
        {
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException(await BuildFriendlyMessageAsync(response), null, response.StatusCode);

            return await response.Content.ReadAsStringAsync();
        }

        // For call sites that need the raw HttpResponseMessage (e.g. to read
        // pagination headers) but still want the same friendly error surfaced.
        public static async Task EnsureSuccessAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException(await BuildFriendlyMessageAsync(response), null, response.StatusCode);
        }

        // Turns a failed GitHub API response into plain language instead of a
        // raw status code or JSON body (e.g. `{"message":"Requires
        // authentication",...}`) reaching someone with no idea what that means
        // or what to do about it. Public (not just used to build the thrown
        // exception above) so callers that report failure through a result DTO
        // instead of an exception — like triggering a deployment — get the
        // same friendly text rather than dumping the raw response themselves.
        public static async Task<string> BuildFriendlyMessageAsync(HttpResponseMessage response)
        {
            // GitHub's anonymous rate limit is 60 requests/hour/IP (vs. 5,000/hour
            // with a PAT) — surface that distinction instead of a raw status code,
            // since it's the single most common failure this app hits without a token.
            var isRateLimit =
                (response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.TooManyRequests)
                && response.Headers.TryGetValues("X-RateLimit-Remaining", out var remaining)
                && remaining.FirstOrDefault() == "0";

            if (isRateLimit)
            {
                var resetSuffix = "";

                if (response.Headers.TryGetValues("X-RateLimit-Reset", out var resetValues)
                    && long.TryParse(resetValues.FirstOrDefault(), out var resetEpoch))
                {
                    var resetAt = DateTimeOffset.FromUnixTimeSeconds(resetEpoch).ToLocalTime();
                    resetSuffix = $" Resets at {resetAt:t}.";
                }

                return "GitHub API rate limit exceeded. Add a Personal Access Token in Settings to raise this " +
                    $"from 60 to 5,000 requests/hour.{resetSuffix}";
            }

            var body = await response.Content.ReadAsStringAsync();
            var githubMessage = ExtractGitHubMessage(body);

            return response.StatusCode switch
            {
                HttpStatusCode.Unauthorized =>
                    "GitHub rejected this request because it requires authentication. Add a Personal Access " +
                    "Token with the \"repo\" and \"workflow\" scopes in Settings, then try again.",

                HttpStatusCode.Forbidden =>
                    "GitHub denied this request. Your Personal Access Token may be missing the \"repo\" or " +
                    "\"workflow\" scope, or doesn't have access to this repository — check it in Settings.",

                HttpStatusCode.NotFound =>
                    "GitHub couldn't find what was requested. Double-check the repository, branch, or " +
                    "workflow configured in Settings.",

                HttpStatusCode.UnprocessableEntity =>
                    string.IsNullOrWhiteSpace(githubMessage)
                        ? "GitHub rejected this request — the branch or the values sent to the workflow may not be valid."
                        : $"GitHub rejected this request: {githubMessage}",

                _ =>
                    string.IsNullOrWhiteSpace(githubMessage)
                        ? $"GitHub API request failed ({(int)response.StatusCode} {response.StatusCode})."
                        : $"GitHub API request failed: {githubMessage}"
            };
        }

        // "invalid value for 'field' on 'resource'" — a generic but readable
        // sentence built from whatever subset of resource/field/code/value
        // GitHub actually included, rather than the raw JSON object.
        private static string DescribeErrorObject(JObject error)
        {
            var field = error["field"]?.ToString();
            var resource = error["resource"]?.ToString();
            var code = error["code"]?.ToString();

            if (!string.IsNullOrWhiteSpace(field) && !string.IsNullOrWhiteSpace(resource))
                return $"invalid value for '{field}' on {resource}" + (string.IsNullOrWhiteSpace(code) ? "" : $" ({code})");

            return error.ToString(Newtonsoft.Json.Formatting.None);
        }

        private static string? ExtractGitHubMessage(string body)
        {
            try
            {
                var json = JObject.Parse(body);

                var message = json["message"]?.ToString();

                // On a 422, GitHub's top-level "message" is often just the
                // generic "Validation Failed" — the actual reason lives in
                // errors[].message (e.g. why a request like a branch push
                // restriction was rejected). Appended when present instead
                // of replacing the top-level message, since some responses
                // only have one or the other.
                // Each element can be a plain string, an object with its own
                // "message", or — as GitHub actually returns for something
                // like "you can't set field X to value Y" — an object with
                // only resource/field/code and no message at all. That last
                // shape used to fall through to e.ToString(), dumping raw
                // JSON braces at the user; DescribeErrorObject turns it into
                // a short readable phrase instead.
                var detail = (json["errors"] as JArray)?
                    .Select(e => (e as JObject) is JObject obj
                        ? obj["message"]?.ToString() ?? DescribeErrorObject(obj)
                        : e.ToString())
                    .Where(m => !string.IsNullOrWhiteSpace(m))
                    .ToList();

                if (detail != null && detail.Count > 0)
                {
                    var joined = string.Join(" ", detail);
                    return string.IsNullOrWhiteSpace(message) ? joined : $"{message}: {joined}";
                }

                return message;
            }
            catch
            {
                return null;
            }
        }
    }
}
