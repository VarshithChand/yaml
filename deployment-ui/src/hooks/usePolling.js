import { useEffect, useRef } from "react";

export default function usePolling(callback, delay) {

    // Keep the latest callback in a ref so the interval below always
    // invokes the freshest closure (with up-to-date state/context),
    // instead of freezing whichever callback existed when the timer
    // was first created.
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {

        callbackRef.current();

        const timer = setInterval(() => callbackRef.current(), delay);

        return () => clearInterval(timer);

    }, [delay]);

}
