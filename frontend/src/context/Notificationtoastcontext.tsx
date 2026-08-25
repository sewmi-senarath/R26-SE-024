import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getStoredRole } from '../api/authApi';
import { fetchNotifications } from '../services/caregiver/Notificationservice';
import { AppNotification } from '../types/caregiver.types';

const POLL_INTERVAL_MS = 20000; 

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

    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const role = await getStoredRole();
      if (role !== 'caregiver') return; 

      await poll();
      interval = setInterval(poll, POLL_INTERVAL_MS);
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
   
  }, []);

  return (
    <NotificationToastContext.Provider value={{ currentToast, dismissCurrentToast }}>
      {children}
    </NotificationToastContext.Provider>
  );
};