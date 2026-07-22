import { useCallback, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";

// Promise-based replacement for window.confirm — the browser-native dialog
// can't be styled, doesn't respect dark mode, and blocks the JS thread.
// Usage: const { confirm, dialog } = useConfirm(); ... if (!(await
// confirm({ title, message, danger: true }))) return; ...and render
// {dialog} once, anywhere in the component's JSX output.
export default function useConfirm() {

    const [state, setState] = useState(null);

    const confirm = useCallback((options) => {

        return new Promise((resolve) => {
            setState({ ...options, resolve });
        });

    }, []);

    function handleConfirm() {
        state?.resolve(true);
        setState(null);
    }

    function handleCancel() {
        state?.resolve(false);
        setState(null);
    }

    const dialog = (
        <ConfirmDialog
            open={!!state}
            title={state?.title}
            message={state?.message}
            confirmLabel={state?.confirmLabel}
            cancelLabel={state?.cancelLabel}
            danger={state?.danger}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, dialog };

}
