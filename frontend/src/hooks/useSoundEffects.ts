import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";

type SoundType = "back" | "success" | "error" | "click";

async function fireHaptic(type: SoundType) {
  try {
    switch (type) {
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "click":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "back":
        await Haptics.selectionAsync();
        break;
    }
  } catch {
    // haptics unavailable (e.g. web) - ignore
  }
}

export const useSoundEffects = () => {
  const soundsRef = useRef<Record<SoundType, Audio.Sound | null>>({
    back: null,
    success: null,
    error: null,
    click: null,
  });

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      Object.values(soundsRef.current).forEach((sound) => sound?.unloadAsync());
    };
  }, []);

  const playSound = async (type: SoundType) => {
    void fireHaptic(type);

    try {
      if (!soundsRef.current[type]) {
        const soundMap: Record<SoundType, any> = {
          back: require("@/assets/audio/back.wav"),
          success: require("@/assets/audio/success.wav"),
          error: require("@/assets/audio/error.wav"),
          click: require("@/assets/audio/click.wav"),
        };

        const { sound } = await Audio.Sound.createAsync(soundMap[type]);
        soundsRef.current[type] = sound;
      }

      await soundsRef.current[type]?.replayAsync();
    } catch (error) {
      console.log("Sound playback error:", error);
    }
  };

  return { playSound };
};
