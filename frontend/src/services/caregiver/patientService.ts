import { authFetch } from '@/src/api/authApi';
import { PatientDetail, Routine } from '../../types/caregiver.types';

const mapRoutine = (raw: any): Routine => ({
  id:        raw._id,
  title:     raw.title,
  time:      raw.time,
  completed: raw.completed,
});

const mapPatient = (raw: any): PatientDetail => ({
  id:                    raw._id,
  name:                  raw.name,
  initials:              raw.initials,
  age:                   raw.age,
  condition:             raw.condition,
  stage:                 raw.stage,
  avatarColor:           raw.avatarColor,
  emoji:                 raw.emoji,
  lastChecked:           raw.lastChecked,
  condition_notes:       raw.condition_notes,
  condition_description: raw.condition_description,
  routines:              (raw.routines || []).map(mapRoutine),
});

export const fetchPatients = async (): Promise<PatientDetail[]> => {
  const data = await authFetch('/caregiver/patients');
  if (!data.success) throw new Error(data.message);
  return data.patients.map(mapPatient);
};

export const createPatient = async (
  patient: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>
): Promise<PatientDetail> => {
  const data = await authFetch('/caregiver/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
  if (!data.success) throw new Error(data.message);
  return mapPatient(data.patient);
};

export const addRoutine = async (
  patientId: string,
  routine: Omit<Routine, 'id'>
): Promise<Routine> => {
  const data = await authFetch(`/caregiver/patients/${patientId}/routines`, {
    method: 'POST',
    body: JSON.stringify(routine),
  });
  if (!data.success) throw new Error(data.message);
  return mapRoutine(data.routine);
};

export const toggleRoutine = async (
  patientId: string,
  routineId: string
): Promise<Routine> => {
  const data = await authFetch(
    `/caregiver/patients/${patientId}/routines/${routineId}/toggle`,
    { method: 'PATCH' }
  );
  if (!data.success) throw new Error(data.message);
  return mapRoutine(data.routine);
};

export const deletePatient = async (patientId: string): Promise<void> => {
  const data = await authFetch(`/caregiver/patients/${patientId}`, {
    method: 'DELETE',
  });
  if (!data.success) throw new Error(data.message);
};