import { useEffect } from "react";

export default function usePolling(callback, delay) {

    useEffect(() => {

        callback();

        const timer = setInterval(callback, delay);

        return () => clearInterval(timer);

    }, [delay]);

}