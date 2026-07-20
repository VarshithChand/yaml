// Drop-in <input> with a small "x" button that appears once there's text to
// clear. Used on plain-text/credential fields where retyping over a stale
// value is annoying — deliberately NOT used on the Personal Access Token
// field, which already has its own "Clear Token" flow (clearing a saved
// token there is a real backend action, not just emptying the box).
export default function ClearableInput({

    value,
    onChange,
    onClear,
    type = "text",
    className = "form-control",
    ...rest

}) {

    return (

        <div className="clearable-input-wrap">

            <input
                type={type}
                className={className}
                value={value}
                onChange={onChange}
                {...rest}
            />

            {value && (

                <button
                    type="button"
                    className="clearable-input-btn"
                    aria-label="Clear"
                    tabIndex={-1}
                    onClick={onClear}
                >
                    &times;
                </button>

            )}

        </div>

    );

}
