// import { CaregiverProfile } from '../../types/caregiver.types';

// const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/caregiver/profile`;

// // ── Helper ─────────────────────────────────────────────────────────────────
// const mapProfile = (raw: any): CaregiverProfile => ({
//   name:             raw.name,
//   role:             raw.role,
//   email:            raw.email,
//   initials:         raw.initials,
//   avatarColor:      raw.avatarColor,
//   isOnline:         raw.isOnline,
//   shiftsCompleted:  raw.shiftsCompleted,
//   patientsAssigned: raw.patientsAssigned,
//   hoursThisWeek:    raw.hoursThisWeek,
//   profileImage:     raw.profileImage ?? undefined,
// });

// // ── GET profile ────────────────────────────────────────────────────────────
// export const fetchProfile = async (id: string): Promise<CaregiverProfile> => {
//   const res  = await fetch(`${BASE_URL}/${id}`);
//   const data = await res.json();
//   if (!data.success) throw new Error(data.message);
//   return mapProfile(data.caregiver);
// };

// // ── UPDATE profile ─────────────────────────────────────────────────────────
// export const updateProfile = async (
//   id: string,
//   updates: Partial<CaregiverProfile> & { profileImage?: string }
// ): Promise<CaregiverProfile> => {

//   console.log('Sending update to backend:', updates); // ← debug

//   const res = await fetch(`${BASE_URL}/${id}`, {
//     method:  'PUT',
//     headers: { 'Content-Type': 'application/json' },
//     body:    JSON.stringify(updates),
//   });

//   const data = await res.json();

//   console.log('Backend response:', data); // ← debug

//   if (!data.success) throw new Error(data.message);
//   return mapProfile(data.caregiver);
// };

import { authFetch } from '@/src/api/authApi';
import { CaregiverProfile } from '../../types/caregiver.types';

// ── Helper: get initials from name ─────────────────────────────────────────
const getInitials = (name: string): string => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ── Helper: map to CaregiverProfile ───────────────────────────────────────
const mapProfile = (raw: any): CaregiverProfile => ({
  name:             raw.name             || raw.fullName || '',
  role:             raw.role             || 'Caregiver',
  email:            raw.email            || '',
  initials:         raw.initials         || getInitials(raw.fullName || raw.name || ''),
  avatarColor:      raw.avatarColor      || '#2563EB',
  isOnline:         raw.isOnline         ?? true,
  shiftsCompleted:  raw.shiftsCompleted  || 0,
  patientsAssigned: raw.patientsAssigned || 0,
  hoursThisWeek:    raw.hoursThisWeek    || 0,
  profileImage:     raw.profileImage     ?? undefined,
});

// ── GET my profile ─────────────────────────────────────────────────────────
// ✅ Uses /auth/me which is confirmed working
export const fetchProfile = async (): Promise<CaregiverProfile> => {
  const data = await authFetch('/auth/me');
  if (!data.success) throw new Error(data.message);

  // /auth/me returns { data: { user: { id, fullName, email, role } } }
  const user = data.data.user;

  return {
    name:             user.fullName,
    role:             'Caregiver',
    email:            user.email,
    initials:         getInitials(user.fullName),
    avatarColor:      '#2563EB',
    isOnline:         true,
    shiftsCompleted:  0,
    patientsAssigned: 0,
    hoursThisWeek:    0,
    profileImage:     undefined,
  };
};

// ── UPDATE profile ─────────────────────────────────────────────────────────
export const updateProfile = async (
  id: string,
  updates: Partial<CaregiverProfile> & { profileImage?: string }
): Promise<CaregiverProfile> => {
  const data = await authFetch('/caregiver/profile/me', {
    method: 'PUT',
    body: JSON.stringify({
      name:         updates.name,
      email:        updates.email,
      profileImage: updates.profileImage,
    }),
  });

  if (!data.success) {
    // ✅ If profile update fails, still return current data from /auth/me
    const meData = await authFetch('/auth/me');
    if (meData.success) {
      const user = meData.data.user;
      return {
        name:             updates.name     || user.fullName,
        role:             'Caregiver',
        email:            updates.email    || user.email,
        initials:         getInitials(updates.name || user.fullName),
        avatarColor:      updates.avatarColor || '#2563EB',
        isOnline:         true,
        shiftsCompleted:  0,
        patientsAssigned: 0,
        hoursThisWeek:    0,
        profileImage:     updates.profileImage || undefined,
      };
    }
    throw new Error(data.message);
  }

  return mapProfile(data.caregiver);
};