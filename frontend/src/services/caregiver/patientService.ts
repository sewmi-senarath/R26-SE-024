import { PatientDetail, Routine } from '../../types/caregiver.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/patients`;
const CAREGIVER_ID = '69ee63f8e63b93df23e01fda'; 

// ── Helper: map backend _id to frontend id ────────────────────────────────
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
  routines:              raw.routines.map(mapRoutine),
});

// ── GET all patients ───────────────────────────────────────────────────────
export const fetchPatients = async (): Promise<PatientDetail[]> => {
  const res  = await fetch(`${BASE_URL}?caregiverId=${CAREGIVER_ID}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.patients.map(mapPatient);
};

// ── CREATE patient ─────────────────────────────────────────────────────────
export const createPatient = async (
  patient: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>
): Promise<PatientDetail> => {
  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...patient,
      caregiverId: CAREGIVER_ID,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapPatient(data.patient);
};

// ── ADD routine ────────────────────────────────────────────────────────────
export const addRoutine = async (
  patientId: string,
  routine: Omit<Routine, 'id'>
): Promise<Routine> => {
  const res = await fetch(`${BASE_URL}/${patientId}/routines`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routine),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapRoutine(data.routine);
};

// ── TOGGLE routine ─────────────────────────────────────────────────────────
export const toggleRoutine = async (
  patientId: string,
  routineId: string
): Promise<Routine> => {
  const res = await fetch(
    `${BASE_URL}/${patientId}/routines/${routineId}/toggle`,
    { method: 'PATCH' }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapRoutine(data.routine);
};

// ── DELETE patient ─────────────────────────────────────────────────────────
export const deletePatient = async (patientId: string): Promise<void> => {
  const res  = await fetch(`${BASE_URL}/${patientId}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
};