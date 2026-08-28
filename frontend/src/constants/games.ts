import { Difficulty, GameId } from "../types/games.types";

export interface GameColorConfig {
  bg: string;
  icon: string;
  badge: string;
  badgeText: string;
  border: string;
  /** Vivid solid color used for the game-selector grid tiles. */
  tile: string;
  /** Slightly darker shade of `tile` for the tile's decorative depth accent. */
  tileDark: string;
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
      tile: "#8B5CF6",
      tileDark: "#7C3AED",
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
      tile: "#3B82F6",
      tileDark: "#2563EB",
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
      tile: "#F59E0B",
      tileDark: "#D97706",
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
      tile: "#22C55E",
      tileDark: "#16A34A",
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
      tile: "#F43F5E",
      tileDark: "#E11D48",
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

  orientation_game: {
    id: "orientation_game",
    title: "Orientation Quiz",
    description: "Answer questions about today's date, your home, and your festivals",
    icon: "🧭",
    color: {
      bg: "bg-sky-50",
      icon: "bg-sky-100",
      badge: "bg-sky-100",
      badgeText: "text-sky-700",
      border: "border-sky-200",
      tile: "#0EA5E9",
      tileDark: "#0284C7",
    },
    targetSection: "Orientation",
    sectionMax: 10,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "4 questions, 3 choices each, no time limit",
      medium: "5 questions, 3 choices each, 30s per question",
      hard: "6 questions, 4 choices each, 20s per question",
    },
  },

  face_name_match: {
    id: "face_name_match",
    title: "Who Is This?",
    description: "Match family photos to their names",
    icon: "👪",
    color: {
      bg: "bg-fuchsia-50",
      icon: "bg-fuchsia-100",
      badge: "bg-fuchsia-100",
      badgeText: "text-fuchsia-700",
      border: "border-fuchsia-200",
      tile: "#D946EF",
      tileDark: "#C026D3",
    },
    targetSection: "Recall",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "3 photos, 3 choices each, no time limit",
      medium: "4 photos, 3 choices each, 20s per question",
      hard: "5 photos, 4 choices each, 15s per question",
    },
  },

  grid_flash: {
    id: "grid_flash",
    title: "Grid Flash",
    description: "Watch the cells light up, then tap them back in order",
    icon: "🎇",
    color: {
      bg: "bg-teal-50",
      icon: "bg-teal-100",
      badge: "bg-teal-100",
      badgeText: "text-teal-700",
      border: "border-teal-200",
      tile: "#14B8A6",
      tileDark: "#0D9488",
    },
    targetSection: "Registration",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "3×3 grid, 3 cells to remember",
      medium: "4×4 grid, 5 cells to remember",
      hard: "5×5 grid, 7 cells to remember",
    },
  },

  listen_repeat: {
    id: "listen_repeat",
    title: "Listen & Repeat",
    description: "Listen to the words, then pick the ones you heard",
    icon: "🔊",
    color: {
      bg: "bg-indigo-50",
      icon: "bg-indigo-100",
      badge: "bg-indigo-100",
      badgeText: "text-indigo-700",
      border: "border-indigo-200",
      tile: "#6366F1",
      tileDark: "#4F46E5",
    },
    targetSection: "Registration",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "3 words, replay allowed, pick from a list",
      medium: "5 words, one listen, pick from a list",
      hard: "7 words, no replay, type them",
    },
  },

  memory_match: {
    id: "memory_match",
    title: "Memory Match",
    description: "Flip cards to find the matching pairs",
    icon: "🃏",
    color: {
      bg: "bg-pink-50",
      icon: "bg-pink-100",
      badge: "bg-pink-100",
      badgeText: "text-pink-700",
      border: "border-pink-200",
      tile: "#EC4899",
      tileDark: "#DB2777",
    },
    targetSection: "Recall",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "6 cards (3 pairs), long look first",
      medium: "12 cards (6 pairs)",
      hard: "16 cards (8 pairs), quick look, move limit",
    },
  },

  story_recall: {
    id: "story_recall",
    title: "Story Recall",
    description: "Read a short story, then answer questions about it",
    icon: "📖",
    color: {
      bg: "bg-cyan-50",
      icon: "bg-cyan-100",
      badge: "bg-cyan-100",
      badgeText: "text-cyan-700",
      border: "border-cyan-200",
      tile: "#06B6D4",
      tileDark: "#0891B2",
    },
    targetSection: "Recall",
    sectionMax: 3,
    difficultyThresholds: { hard: 80, medium: 50 },
    difficultyDescriptions: {
      easy: "Short story, 2 questions",
      medium: "Longer story, 4 questions",
      hard: "Long story, 6 questions, delay before asking",
    },
  },
};

export const GAME_ORDER: GameId[] = [
  "orientation_game",
  "face_name_match",
  "attention_game",
  "photo_puzzle",
  "word_puzzle",
  "memory_recall",
  "object_recall",
  "grid_flash",
  "listen_repeat",
  "memory_match",
  "story_recall",
];
