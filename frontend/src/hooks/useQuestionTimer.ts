// per-question countdown

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseQuestionTimerOptions {
  limitSeconds: number | null;
  onExpire: () => void;
  autoStart?: boolean;
}

export function useQuestionTimer({ limitSeconds, onExpire, autoStart = true }: UseQuestionTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState<number>(limitSeconds ?? 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiredRef = useRef(false);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = useCallback(() => {
    if (!limitSeconds) return;
    expiredRef.current = false;
    setSecondsLeft(limitSeconds);

    clear();
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clear();
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [limitSeconds, onExpire]);

  const stop = useCallback(() => clear(), []);

  const reset = useCallback(() => {
    clear();
    setSecondsLeft(limitSeconds ?? 0);
    expiredRef.current = false;
  }, [limitSeconds]);

  // Auto-start when limitSeconds changes (i.e. new question loaded)
  useEffect(() => {
    if (autoStart && limitSeconds) start();
    return () => clear();
  }, [limitSeconds]);

  const progressPercent = limitSeconds
    ? ((limitSeconds - secondsLeft) / limitSeconds) * 100
    : 0;

  const isWarning = limitSeconds ? secondsLeft <= Math.floor(limitSeconds * 0.3) : false;

  return { secondsLeft, progressPercent, isWarning, start, stop, reset };
}