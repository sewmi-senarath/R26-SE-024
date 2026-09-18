import { getSoundEffectsEnabled, setSoundEffectsEnabled } from "@/src/utils/soundEffectsPreference";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const changedByUser = useRef(false);

  useEffect(() => {
    let active = true;

    void getSoundEffectsEnabled().then((enabled) => {
      if (active && !changedByUser.current) {
        setSoundEnabled(enabled);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleSound = useCallback(() => {
    changedByUser.current = true;
    setSoundEnabled((current) => {
      const next = !current;
      void setSoundEffectsEnabled(next);
      return next;
    });
  }, []);

  return { soundEnabled, toggleSound };
}
