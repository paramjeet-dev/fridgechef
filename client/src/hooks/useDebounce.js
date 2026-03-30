import { useState, useEffect } from 'react';

/**
 * Delays updating the returned value until the input value
 * stops changing for `delay` milliseconds.
 *
 * Usage:
 *   const debouncedQuery = useDebounce(searchQuery, 400);
 *   useEffect(() => { fetchResults(debouncedQuery) }, [debouncedQuery]);
 *
 * @param {*}      value - The value to debounce
 * @param {number} delay - Milliseconds to wait after last change
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
