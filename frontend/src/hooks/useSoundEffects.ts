import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

type SoundType = "back" | "success" | "error" | "click";

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
