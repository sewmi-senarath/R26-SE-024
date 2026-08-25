
import { authFetch } from '@/src/api/authApi';
import { CaregiverProfile } from '../../types/caregiver.types';

// get initials from name 
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

// map to CaregiverProfile 
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

// GET my profile 

export const fetchProfile = async (): Promise<CaregiverProfile> => {
  const data = await authFetch('/auth/me');
  if (!data.success) throw new Error(data.message);

 
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

// UPDATE profile 
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