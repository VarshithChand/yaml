import { createContext, useCallback, useRef, useState } from "react";

export const ToastContext = createContext();

let nextId = 0;

// Errors stay up longer than a success confirmation — there's usually more
// to actually read (a GitHub-sourced message explaining what went wrong).
const DURATIONS = { success: 3500, error: 6000 };

// Simple checkmark-in-circle / cross-in-circle — circle + polyline/lines
// only, matching the sidebar icon discipline of never hand-authoring
// curved SVG path data.
function ToastSuccessIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
            <polyline points="4.5,8.2 7,10.7 11.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ToastErrorIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
            <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    );
}

// Stacks multiple toasts (the previous version replaced whatever was
// showing, so two quick actions meant the first message vanished before
// anyone could read it) with a manual dismiss button and a proper exit
// animation instead of just disappearing.
export default function ToastProvider({ children }) {

    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {

        clearTimeout(timers.current[id]);
        delete timers.current[id];

        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 200);

    }, []);

    const show = useCallback((message, type = "success") => {

        const id = ++nextId;

        setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

        timers.current[id] = setTimeout(() => dismiss(id), DURATIONS[type] || 3500);

    }, [dismiss]);

    return (

        <ToastContext.Provider value={{ show }}>

            {children}

            <div className="toast-stack">

                {toasts.map((t) => (

                    <div
                        key={t.id}
                        className={`toast ${t.type} ${t.leaving ? "toast-leaving" : ""}`}
                        role="status"
                    >
                        <span className="toast-icon">
                            {t.type === "error" ? <ToastErrorIcon /> : <ToastSuccessIcon />}
                        </span>

                        <span className="toast-message">{t.message}</span>

                        <button
                            type="button"
                            className="toast-close"
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss notification"
                        >
                            &times;
                        </button>
                    </div>

                ))}

            </div>

        </ToastContext.Provider>

    );

}
