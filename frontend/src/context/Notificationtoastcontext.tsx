import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getStoredRole } from '../api/authApi';
import { fetchNotifications } from '../services/caregiver/Notificationservice';
import { AppNotification } from '../types/caregiver.types';

const POLL_INTERVAL_MS = 20000; // check for new notifications every 20 seconds

interface NotificationToastContextValue {
  currentToast: AppNotification | null;
  dismissCurrentToast: () => void;
}

const NotificationToastContext = createContext<NotificationToastContextValue>({
  currentToast: null,
  dismissCurrentToast: () => {},
});

export const useNotificationToast = () => useContext(NotificationToastContext);

export const NotificationToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<AppNotification | null>(null);
  const queueRef  = useRef<AppNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstPollRef = useRef(true);

  const showNext = () => {
    if (queueRef.current.length === 0) {
      setCurrentToast(null);
      return;
    }
    const [next, ...rest] = queueRef.current;
    queueRef.current = rest;
    setCurrentToast(next);
  };

  const dismissCurrentToast = () => {
    showNext();
  };

  const poll = async () => {
    try {
      const notifications = await fetchNotifications();

      // On the very first poll of the session, mark everything already
      // unread as "seen" without popping toasts for all of it at once —
      // otherwise logging in with 5 old unread notifications would fire
      // 5 toasts back-to-back. Only genuinely *new* notifications from here
      // on will trigger a toast.
      if (isFirstPollRef.current) {
        notifications.forEach((n) => seenIdsRef.current.add(n.id));
        isFirstPollRef.current = false;
        return;
      }

      const freshUnseen = notifications.filter(
        (n) => !n.acknowledged && !seenIdsRef.current.has(n.id),
      );

      freshUnseen.forEach((n) => seenIdsRef.current.add(n.id));

      if (freshUnseen.length > 0) {
        queueRef.current = [...queueRef.current, ...freshUnseen];
        if (!currentToast) showNext();
      }
    } catch (error) {
      // Silent — a failed poll should never disrupt whatever screen the
      // user is actually on. It'll just try again next interval.
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const role = await getStoredRole();
      if (role !== 'caregiver') return; // only caregivers have notifications right now

      await poll();
      interval = setInterval(poll, POLL_INTERVAL_MS);
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificationToastContext.Provider value={{ currentToast, dismissCurrentToast }}>
      {children}
    </NotificationToastContext.Provider>
  );
};