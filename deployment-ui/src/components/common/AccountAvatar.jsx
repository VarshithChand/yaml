// A circular avatar with a name tooltip — used anywhere the UI needs to
// show "whose account is this" without spelling the name out as visible
// text. Falls back to the first letter of the name when there's no photo
// (an OAuth-logged-in user has no stored avatar, only a PAT's token owner
// does).
export default function AccountAvatar({ avatarUrl, name, size = 32, className = "" }) {

    return (

        <span
            className={`account-avatar ${className}`}
            style={{ width: size, height: size }}
            title={name || "Not signed in"}
        >

            {avatarUrl ? (
                <img src={avatarUrl} alt="" />
            ) : (
                <span>{name ? name[0].toUpperCase() : "?"}</span>
            )}

        </span>

    );

}
