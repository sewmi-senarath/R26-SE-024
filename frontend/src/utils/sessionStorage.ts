// persist session to AsyncStorage
import { MMSESession } from "@/src/types/assessment.types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = (patientId: string, caregiverId: string) =>
  `mmse_session_${patientId}_${caregiverId}`;

export async function saveSession(session: MMSESession): Promise<void> {
  await AsyncStorage.setItem(
    KEY(session.patientId, session.caregiverId),
    JSON.stringify(session),
  );
}

export async function loadSession(
  patientId: string,
  caregiverId: string,
): Promise<MMSESession | null> {
  const raw = await AsyncStorage.getItem(KEY(patientId, caregiverId));
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession(
  patientId: string,
  caregiverId: string,
): Promise<void> {
  await AsyncStorage.removeItem(KEY(patientId, caregiverId));
}
