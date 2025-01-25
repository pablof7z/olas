import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T>(value: T, delay: number) {
    const [throttledValue, setThrottledValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setThrottledValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return throttledValue;
}