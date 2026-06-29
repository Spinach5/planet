import { useState, useEffect } from 'react';

/**
 * Debounce a value. Returns the debounced value that updates after `delay` ms
 * of no changes to the input.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default 300)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
