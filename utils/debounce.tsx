import { useEffect, useRef, useState } from 'react';

export function useDebounce<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T>(value: T, delay: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastExec = useRef(Date.now());
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const sinceLast = now - lastExec.current;

    // If enough time has passed, update immediately
    if (sinceLast >= delay) {
      lastExec.current = now;
      setThrottled(value);
    } else {
      // Otherwise schedule a trailing update
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        lastExec.current = Date.now();
        setThrottled(value);
      }, delay - sinceLast);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, [value, delay]);

  return throttled;
}