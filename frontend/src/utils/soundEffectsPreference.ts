import AsyncStorage from "@react-native-async-storage/async-storage";

const SOUND_EFFECTS_KEY = "patient.soundEffectsEnabled";

let cachedSoundEffectsEnabled: boolean | null = null;
let preferenceVersion = 0;

export async function getSoundEffectsEnabled(): Promise<boolean> {
  if (cachedSoundEffectsEnabled !== null) {
    return cachedSoundEffectsEnabled;
  }

  try {
    const readVersion = preferenceVersion;
    const storedValue = await AsyncStorage.getItem(SOUND_EFFECTS_KEY);
    const storedPreference = storedValue !== "false";

    if (cachedSoundEffectsEnabled === null && preferenceVersion === readVersion) {
      cachedSoundEffectsEnabled = storedPreference;
    }

    return cachedSoundEffectsEnabled ?? storedPreference;
  } catch {
    return cachedSoundEffectsEnabled ?? true;
  }
}

export async function setSoundEffectsEnabled(enabled: boolean): Promise<void> {
  preferenceVersion += 1;
  cachedSoundEffectsEnabled = enabled;

  try {
    await AsyncStorage.setItem(SOUND_EFFECTS_KEY, String(enabled));
  } catch (error) {
    console.log("Unable to save sound effects preference:", error);
  }
}
