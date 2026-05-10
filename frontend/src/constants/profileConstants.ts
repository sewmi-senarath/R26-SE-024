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

export const fallbackReviews: Review[] = [
  {
    gameId: "memory_recall",
    sessions: 6,
    bestScore: "82%",
    lastPlayed: "Today",
    review: "Strong recent recall. Keep practicing short daily sessions.",
  },
  {
    gameId: "object_recall",
    sessions: 4,
    bestScore: "74%",
    lastPlayed: "Yesterday",
    review: "Good object recognition with room to improve delayed recall.",
  },
  {
    gameId: "attention_game",
    sessions: 8,
    bestScore: "68%",
    lastPlayed: "2 days ago",
    review: "Focus improves when targets are larger and rounds are shorter.",
  },
  {
    gameId: "photo_puzzle",
    sessions: 3,
    bestScore: "90%",
    lastPlayed: "This week",
    review: "Family images are familiar and motivating.",
  },
  {
    gameId: "word_puzzle",
    sessions: 5,
    bestScore: "71%",
    lastPlayed: "This week",
    review: "Language tasks are steady. Letter hints are helpful.",
  },
];

export const appStats = [
  {
    label: "App Opens",
    value: "42",
    icon: "phone-portrait-outline" as const,
    tone: "#2563EB",
  },
  {
    label: "This Week",
    value: "9",
    icon: "calendar-outline" as const,
    tone: "#16A34A",
  },
  {
    label: "Games Played",
    value: "26",
    icon: "game-controller-outline" as const,
    tone: "#F97316",
  },
  {
    label: "Avg. Session",
    value: "14m",
    icon: "time-outline" as const,
    tone: "#8B5CF6",
  },
];

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
