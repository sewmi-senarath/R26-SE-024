import { CaregiverTask } from '../../types/caregiver.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/tasks`;
const CAREGIVER_ID = '69ee63f8e63b93df23e01fda'; 

// ── Helper: map backend _id → frontend id ─────────────────────────────────
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

// ── Format date as YYYY-MM-DD ──────────────────────────────────────────────
export const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

// ── GET all tasks for a date ───────────────────────────────────────────────
export const fetchTasks = async (date: Date): Promise<CaregiverTask[]> => {
  const res  = await fetch(
    `${BASE_URL}?date=${formatDate(date)}&caregiverId=${CAREGIVER_ID}`
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.tasks.map(mapTask);
};

// ── CREATE task ────────────────────────────────────────────────────────────
export const createTask = async (
  task: Omit<CaregiverTask, 'id'>,
  date: Date
): Promise<CaregiverTask> => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...task,
      date:        formatDate(date),
      caregiverId: CAREGIVER_ID,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapTask(data.task);
};

// ── TOGGLE task status ─────────────────────────────────────────────────────
export const toggleTask = async (id: string): Promise<CaregiverTask> => {
  const res  = await fetch(`${BASE_URL}/${id}/toggle`, { method: 'PATCH' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapTask(data.task);
};

// ── DELETE task ────────────────────────────────────────────────────────────
export const deleteTask = async (id: string): Promise<void> => {
  const res  = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
};