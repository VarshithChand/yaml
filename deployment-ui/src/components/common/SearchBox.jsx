export default function SearchBox({

    placeholder,

    value,

    onChange

}) {

    return (

        <input

            type="text"

            className="form-control search-inline"

            placeholder={placeholder}

            value={value}

            onChange={(e) => onChange(e.target.value)}

        />

    );

}
