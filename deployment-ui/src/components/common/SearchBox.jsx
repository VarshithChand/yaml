export default function SearchBox({

    placeholder,

    value,

    onChange

}) {

    return (

        <div className="clearable-input-wrap">

            <input

                type="text"

                className="form-control search-inline"

                placeholder={placeholder}

                value={value}

                onChange={(e) => onChange(e.target.value)}

            />

            {value && (

                <button
                    type="button"
                    className="clearable-input-btn"
                    aria-label="Clear"
                    tabIndex={-1}
                    onClick={() => onChange("")}
                >
                    &times;
                </button>

            )}

        </div>

    );

}
