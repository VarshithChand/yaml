// Accepts a full GitHub URL ("https://github.com/owner/repo", with or
// without ".git"/trailing slash) or the "owner/repo" shorthand.
export default function parseRepoUrl(input) {

    const trimmed = input.trim().replace(/\.git$/i, "").replace(/\/+$/, "");

    const shorthand = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);

    if (shorthand) {
        return { owner: shorthand[1], repository: shorthand[2] };
    }

    const urlMatch = trimmed.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)$/i);

    if (urlMatch) {
        return { owner: urlMatch[1], repository: urlMatch[2] };
    }

    return null;

}
