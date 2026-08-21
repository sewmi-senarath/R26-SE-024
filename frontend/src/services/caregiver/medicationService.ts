import { authFetch } from '@/src/api/authApi';
import { Medication } from '../../types/caregiver.types';

const mapMedication = (raw: any): Medication => ({
  id:              raw._id,
  name:            raw.name,
  dose:            raw.dose,
  form:            raw.form,
  patientName:     raw.patientName,
  patientInitials: raw.patientInitials,
  patientColor:    raw.patientColor,
  time:            raw.time,
  timeSlot:        raw.timeSlot,
  status:          raw.status,
  streak:          raw.streak,
});

export const fetchMedications = async (): Promise<Medication[]> => {
  const data = await authFetch('/caregiver/medications');
  if (!data.success) throw new Error(data.message);
  return data.medications.map(mapMedication);
};

export const createMedication = async (med: {
  name: string;
  dose: string;
  form: string;
  notes: string;
  time: string;
  timeSlot: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  patientColor: string;
}): Promise<Medication> => {
  const data = await authFetch('/caregiver/medications', {
    method: 'POST',
    body: JSON.stringify(med),
  });
  if (!data.success) throw new Error(data.message);
  return mapMedication(data.medication);
};

export const toggleMedicationStatus = async (id: string): Promise<Medication> => {
  const data = await authFetch(`/caregiver/medications/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!data.success) throw new Error(data.message);
  return mapMedication(data.medication);
};

export const deleteMedication = async (id: string): Promise<void> => {
  const data = await authFetch(`/caregiver/medications/${id}`, {
    method: 'DELETE',
  });
  if (!data.success) throw new Error(data.message);
};