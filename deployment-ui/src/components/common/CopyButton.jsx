import { useState } from "react";

// Two overlapping squares (copy) / a checkmark (copied) — rect and
// polyline only, matching the icon discipline used across this app.
function CopyIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1.5" y="1.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <polyline points="2.5,7 5,9.5 10.5,3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Small icon-only button that copies `value` to the clipboard and flips
// to a checkmark for a moment as feedback — used next to run IDs, commit
// SHAs, and other values people need to paste elsewhere but shouldn't
// have to select-and-copy by hand.
export default function CopyButton({ value, label = "Copy" }) {

    const [copied, setCopied] = useState(false);

    async function handleCopy(e) {

        e.stopPropagation();

        try {

            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);

        }
        catch (err) {

            console.error(err);

        }

    }

    return (

        <button
            type="button"
            className="copy-button"
            onClick={handleCopy}
            title={copied ? "Copied!" : label}
            aria-label={copied ? "Copied" : label}
        >
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

    );

}
