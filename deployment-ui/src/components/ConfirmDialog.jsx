export default function ConfirmDialog({

    open,

    title,

    message,

    confirmLabel = "Deploy",

    onConfirm,

    onCancel

}){

    if(!open)

        return null;

    return(

        <div className="dialog-backdrop">

            <div className="dialog">

                <h2>

                    {title}

                </h2>

                <p>

                    {message}

                </p>

                <div>

                    <button
                        className="btn btn-success"
                        onClick={onConfirm}
                    >

                        {confirmLabel}

                    </button>

                    <button
                        className="btn"
                        onClick={onCancel}
                    >

                        Cancel

                    </button>

                </div>

            </div>

        </div>

    );

}