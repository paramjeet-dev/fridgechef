import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Reusable countdown timer hook.
 *
 * @param {number} initialSeconds - Starting duration in seconds
 * @param {Function} onComplete   - Callback fired when timer reaches zero
 * @returns {{ remaining, isRunning, isComplete, start, pause, reset, setDuration }}
 */
export function useTimer(initialSeconds = 300, onComplete = () => {}) {
  const [duration, setDurationState] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  // Tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsComplete(true);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, onComplete]);

  const start = useCallback(() => {
    if (!isComplete) setIsRunning(true);
  }, [isComplete]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsComplete(false);
    setRemaining(duration);
  }, [duration]);

  const setDuration = useCallback((seconds) => {
    const clamped = Math.max(30, seconds);
    setDurationState(clamped);
    setRemaining(clamped);
    setIsComplete(false);
    setIsRunning(false);
  }, []);

  const progress = duration > 0 ? remaining / duration : 0; // 1 = full, 0 = empty

  return { remaining, duration, isRunning, isComplete, progress, start, pause, reset, setDuration };
}
