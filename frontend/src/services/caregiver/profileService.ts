import { CaregiverProfile } from '../../types/caregiver.types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/profile`;

// ── Helper ─────────────────────────────────────────────────────────────────
const mapProfile = (raw: any): CaregiverProfile => ({
  name:             raw.name,
  role:             raw.role,
  email:            raw.email,
  initials:         raw.initials,
  avatarColor:      raw.avatarColor,
  isOnline:         raw.isOnline,
  shiftsCompleted:  raw.shiftsCompleted,
  patientsAssigned: raw.patientsAssigned,
  hoursThisWeek:    raw.hoursThisWeek,
  profileImage:     raw.profileImage ?? undefined,
});

// ── GET profile ────────────────────────────────────────────────────────────
export const fetchProfile = async (id: string): Promise<CaregiverProfile> => {
  const res  = await fetch(`${BASE_URL}/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return mapProfile(data.caregiver);
};

// ── UPDATE profile ─────────────────────────────────────────────────────────
export const updateProfile = async (
  id: string,
  updates: Partial<CaregiverProfile> & { profileImage?: string }
): Promise<CaregiverProfile> => {

  console.log('Sending update to backend:', updates); // ← debug

  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(updates),
  });

  const data = await res.json();

  console.log('Backend response:', data); // ← debug

  if (!data.success) throw new Error(data.message);
  return mapProfile(data.caregiver);
};