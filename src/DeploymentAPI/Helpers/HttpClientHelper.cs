using System.Net;

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
                throw await BuildFriendlyExceptionAsync(response);

            return await response.Content.ReadAsStringAsync();
        }

        public static async Task<string> PostAsync(
            HttpClient client,
            string url,
            HttpContent content)
        {
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
                throw await BuildFriendlyExceptionAsync(response);

            return await response.Content.ReadAsStringAsync();
        }

        // For call sites that need the raw HttpResponseMessage (e.g. to read
        // pagination headers) but still want the same friendly error surfaced.
        public static async Task EnsureSuccessAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
                throw await BuildFriendlyExceptionAsync(response);
        }

        // GitHub's anonymous rate limit is 60 requests/hour/IP (vs. 5,000/hour
        // with a PAT) — surface that distinction instead of a raw status code,
        // since it's the single most common failure this app hits without a token.
        private static async Task<HttpRequestException> BuildFriendlyExceptionAsync(HttpResponseMessage response)
        {
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

                return new HttpRequestException(
                    "GitHub API rate limit exceeded. Add a Personal Access Token in Settings to raise this from " +
                    $"60 to 5,000 requests/hour.{resetSuffix}",
                    null,
                    response.StatusCode);
            }

            var body = await response.Content.ReadAsStringAsync();

            return new HttpRequestException(
                $"GitHub API request failed ({(int)response.StatusCode} {response.StatusCode}): {body}",
                null,
                response.StatusCode);
        }
    }
}
