// A circular avatar that reveals the account name on hover — sliding out
// to its left rather than a plain browser tooltip — so the UI doesn't
// spell the name out as permanent visible text. Falls back to the first
// letter of the name when there's no photo (an OAuth-logged-in user has
// no stored avatar, only a PAT's token owner does).
export default function AccountAvatar({ avatarUrl, name, size = 32, className = "" }) {

    return (

        <span className={`account-avatar-wrap ${className}`}>

            <span className="account-avatar-name">{name || "Not signed in"}</span>

            <span
                className="account-avatar"
                style={{ width: size, height: size }}
            >

                {avatarUrl ? (
                    <img src={avatarUrl} alt="" />
                ) : (
                    <span>{name ? name[0].toUpperCase() : "?"}</span>
                )}

            </span>

        </span>

    );

}
