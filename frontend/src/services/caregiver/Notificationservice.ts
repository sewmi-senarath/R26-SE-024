import { authFetch } from '@/src/api/authApi';
import { AppNotification } from '../../types/caregiver.types';

const formatTime = (isoString: string): string =>
  new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const mapNotification = (raw: any): AppNotification => ({
  id:           raw._id,
  patientName:  raw.patientName,
  message:      raw.message,
  time:         formatTime(raw.createdAt),
  severity:     raw.severity,
  acknowledged: raw.acknowledged,
});

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const data = await authFetch('/caregiver/notifications');
  if (!data.success) throw new Error(data.message);
  return data.notifications.map(mapNotification);
};

export const acknowledgeNotification = async (id: string): Promise<void> => {
  const data = await authFetch(`/caregiver/notifications/${id}/acknowledge`, {
    method: 'PATCH',
  });
  if (!data.success) throw new Error(data.message);
};

export const acknowledgeAllNotifications = async (): Promise<void> => {
  const data = await authFetch('/caregiver/notifications/acknowledge-all', {
    method: 'PATCH',
  });
  if (!data.success) throw new Error(data.message);
};