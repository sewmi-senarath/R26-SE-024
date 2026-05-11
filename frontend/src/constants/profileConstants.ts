import { GameId } from "@/src/types/games.types";
import { Ionicons } from "@expo/vector-icons";
import { SettingKey } from "../hooks/useSettings";

export type Review = {
  gameId: GameId;
  sessions: number;
  bestScore: string;
  lastPlayed: string;
  review: string;
};

export const settingRows: {
  key: SettingKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "sound",
    title: "Sound Effects",
    description: "Turn game and button sounds on or off.",
    icon: "volume-high-outline",
  },
  {
    key: "largeLetters",
    title: "Bigger Letters",
    description: "Increase text size across patient activities.",
    icon: "text-outline",
  },
  {
    key: "passwordAlerts",
    title: "Password Reminders",
    description: "Show prompts for password safety and changes.",
    icon: "lock-closed-outline",
  },
];
