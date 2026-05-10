import { Difficulty, GameId } from "../types/games.types";

export interface GameColorConfig {
  bg: string;
  icon: string;
  badge: string;
  badgeText: string;
  border: string;
}

export interface GameConfigEntry {
  id: GameId;
  title: string;
  description: string;
  icon: string;
  color: GameColorConfig;
  targetSection: string;
  sectionMax: number;
  difficultyThresholds: { hard: number; medium: number };
  difficultyDescriptions: Record<Difficulty, string>;
}

export const GAME_CONFIGS: Record<GameId, GameConfigEntry> = {
  memory_recall: {
    id: "memory_recall",
    title: "Memory Recall",
    description: "Remember and recall sequences of items",
    icon: "🧠",
    color: {
      bg: "bg-purple-50",
      icon: "bg-purple-100",
      badge: "bg-purple-100",
      badgeText: "text-purple-700",
      border: "border-purple-200",
    },
    targetSection: "Registration",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "Short sequences, extra time, visual hints provided",
      medium: "Standard sequences, normal time limits",
      hard: "Long sequences, strict time limits, no hints",
    },
  },

  object_recall: {
    id: "object_recall",
    title: "Object Recall",
    description: "Identify and remember everyday objects",
    icon: "🔍",
    color: {
      bg: "bg-blue-50",
      icon: "bg-blue-100",
      badge: "bg-blue-100",
      badgeText: "text-blue-700",
      border: "border-blue-200",
    },
    targetSection: "Registration",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "3 objects, long display time, category hints",
      medium: "5 objects, standard display time",
      hard: "8 objects, brief display, no category hints",
    },
  },

  attention_game: {
    id: "attention_game",
    title: "Attention Game",
    description: "Focus and track patterns under time pressure",
    icon: "🎯",
    color: {
      bg: "bg-amber-50",
      icon: "bg-amber-100",
      badge: "bg-amber-100",
      badgeText: "text-amber-700",
      border: "border-amber-200",
    },
    targetSection: "Attention",
    sectionMax: 5,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "Slow patterns, fewer distractors, larger targets",
      medium: "Moderate speed, standard distractors",
      hard: "Fast patterns, many distractors, small targets",
    },
  },

  photo_puzzle: {
    id: "photo_puzzle",
    title: "Photo Puzzle",
    description: "Piece together familiar photos",
    icon: "🖼️",
    color: {
      bg: "bg-green-50",
      icon: "bg-green-100",
      badge: "bg-green-100",
      badgeText: "text-green-700",
      border: "border-green-200",
    },
    targetSection: "Orientation",
    sectionMax: 10,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "4-piece puzzle, ghost image guide shown",
      medium: "9-piece puzzle, no guide",
      hard: "16-piece puzzle, rotated pieces, no guide",
    },
  },

  word_puzzle: {
    id: "word_puzzle",
    title: "Word Puzzle",
    description: "Find and arrange words from memory",
    icon: "📝",
    color: {
      bg: "bg-rose-50",
      icon: "bg-rose-100",
      badge: "bg-rose-100",
      badgeText: "text-rose-700",
      border: "border-rose-200",
    },
    targetSection: "Language",
    sectionMax: 9,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "3-letter words, letter hints shown",
      medium: "5-letter words, no hints",
      hard: "8-letter words, time limited, scrambled",
    },
  },
};

export const GAME_ORDER: GameId[] = [
  "memory_recall",
  "object_recall",
  "attention_game",
  "photo_puzzle",
  "word_puzzle",
];
