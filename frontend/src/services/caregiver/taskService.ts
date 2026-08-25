

import { authFetch } from '@/src/api/authApi';
import { CaregiverTask } from '../../types/caregiver.types';

// map backend _id → frontend id 
const mapTask = (raw: any): CaregiverTask => ({
  id:              raw._id,
  title:           raw.title,
  patientName:     raw.patientName,
  patientInitials: raw.patientInitials,
  patientColor:    raw.patientColor,
  time:            raw.time,
  status:          raw.status,
  priority:        raw.priority,
  assignee:        raw.assignee,
  category:        raw.category,
});

// Format date as YYYY-MM-DD 
export const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

// GET all tasks for a date 
export const fetchTasks = async (date: Date): Promise<CaregiverTask[]> => {
  // ✅ Token auto-identifies caregiver - no hardcoded ID needed
  const data = await authFetch(`/caregiver/tasks?date=${formatDate(date)}`);
  if (!data.success) throw new Error(data.message);
  return data.tasks.map(mapTask);
};

// CREATE task 
export const createTask = async (
  task: Omit<CaregiverTask, 'id'>,
  date: Date
): Promise<CaregiverTask> => {
  // caregiverId auto-set from JWT token in backend
  const data = await authFetch('/caregiver/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...task,
      date: formatDate(date),
    }),
  });
  if (!data.success) throw new Error(data.message);
  return mapTask(data.task);
};

// TOGGLE task status
export const toggleTask = async (id: string): Promise<CaregiverTask> => {
  const data = await authFetch(`/caregiver/tasks/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!data.success) throw new Error(data.message);
  return mapTask(data.task);
};

// DELETE task
export const deleteTask = async (id: string): Promise<void> => {
  const data = await authFetch(`/caregiver/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!data.success) throw new Error(data.message);
};