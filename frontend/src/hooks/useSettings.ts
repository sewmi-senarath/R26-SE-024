import { useState } from "react";

export type SettingKey = "sound" | "largeLetters" | "passwordAlerts";

export function useSettings() {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({
    sound: true,
    largeLetters: false,
    passwordAlerts: true,
  });

  const toggleSetting = (key: SettingKey) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return { settings, toggleSetting };
}
