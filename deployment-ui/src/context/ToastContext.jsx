import { createContext, useState } from "react";

export const ToastContext = createContext();

export default function ToastProvider({ children }) {

    const [toast, setToast] = useState(null);

    function show(message, type = "success") {

        setToast({

            message,

            type

        });

        setTimeout(() => {

            setToast(null);

        }, 3000);

    }

    return (

        <ToastContext.Provider
            value={{ show }}
        >

            {children}

            {

                toast &&

                <div
                    className={`toast ${toast.type}`}
                >

                    {toast.message}

                </div>

            }

        </ToastContext.Provider>

    );

}