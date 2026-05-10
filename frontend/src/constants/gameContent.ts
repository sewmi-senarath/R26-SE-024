import {
    AttentionGameConfig,
    Difficulty,
    GameId,
    MemoryRecallConfig,
    ObjectRecallConfig,
    PhotoPuzzleConfig,
    WordPuzzleConfig,
} from "../types/games.types";

// ── Shared item pools
const SEQUENCE_ITEMS = [
  { id: "s1", emoji: "🍎", label: "Apple", category: "Food" },
  { id: "s2", emoji: "🐕", label: "Dog", category: "Animal" },
  { id: "s3", emoji: "🚗", label: "Car", category: "Vehicle" },
  { id: "s4", emoji: "🌸", label: "Flower", category: "Nature" },
  { id: "s5", emoji: "📚", label: "Book", category: "Object" },
  { id: "s6", emoji: "🎵", label: "Music", category: "Art" },
  { id: "s7", emoji: "🏠", label: "House", category: "Place" },
];

const RECALL_OBJECTS = [
  { id: "o1", emoji: "🔑", label: "Keys", category: "Household" },
  { id: "o2", emoji: "👓", label: "Glasses", category: "Personal" },
  { id: "o3", emoji: "☕", label: "Cup", category: "Household" },
  { id: "o4", emoji: "📱", label: "Phone", category: "Technology" },
  { id: "o5", emoji: "🖊️", label: "Pen", category: "Stationery" },
  { id: "o6", emoji: "🧦", label: "Socks", category: "Clothing" },
  { id: "o7", emoji: "🪴", label: "Plant", category: "Nature" },
  { id: "o8", emoji: "🕯️", label: "Candle", category: "Household" },
];

const PUZZLE_WORDS = [
  // easy — 3 letters
  { id: "w1", word: "CAT", hint: "A furry pet", category: "Animals" },
  { id: "w2", word: "SUN", hint: "Shines in the sky", category: "Nature" },
  { id: "w3", word: "CUP", hint: "You drink from it", category: "Objects" },
  // medium — 5 letters
  { id: "w4", word: "APPLE", hint: "A red fruit", category: "Food" },
  { id: "w5", word: "CLOCK", hint: "Shows the time", category: "Objects" },
  { id: "w6", word: "CHAIR", hint: "You sit on it", category: "Furniture" },
  // hard — 8 letters
  { id: "w7", word: "CALENDAR", hint: "Tracks dates", category: "Objects" },
  { id: "w8", word: "UMBRELLA", hint: "Used in rain", category: "Objects" },
  { id: "w9", word: "ELEPHANT", hint: "Large animal", category: "Animals" },
];

// ── Memory Recall configs ─────────────────────────────────────
const MEMORY_RECALL: Record<Difficulty, MemoryRecallConfig> = {
  easy: {
    sequenceLength: 3,
    displayTimeMs: 3000,
    timeLimitSeconds: 60,
    showHints: true,
    items: SEQUENCE_ITEMS.slice(0, 3),
  },
  medium: {
    sequenceLength: 5,
    displayTimeMs: 2000,
    timeLimitSeconds: 45,
    showHints: false,
    items: SEQUENCE_ITEMS.slice(0, 5),
  },
  hard: {
    sequenceLength: 7,
    displayTimeMs: 1000,
    timeLimitSeconds: 30,
    showHints: false,
    items: SEQUENCE_ITEMS,
  },
};

// ── Object Recall configs
const OBJECT_RECALL: Record<Difficulty, ObjectRecallConfig> = {
  easy: {
    objectCount: 3,
    displayTimeMs: 8000,
    timeLimitSeconds: 60,
    showCategoryHints: true,
    objects: RECALL_OBJECTS.slice(0, 3),
  },
  medium: {
    objectCount: 5,
    displayTimeMs: 10000,
    timeLimitSeconds: 45,
    showCategoryHints: false,
    objects: RECALL_OBJECTS.slice(0, 5),
  },
  hard: {
    objectCount: 8,
    displayTimeMs: 15000,
    timeLimitSeconds: 30,
    showCategoryHints: false,
    objects: RECALL_OBJECTS,
  },
};

// ── Attention Game configs
const ATTENTION_GAME: Record<Difficulty, AttentionGameConfig> = {
  easy: {
    targetEmoji: "⭐",
    distractorEmojis: ["🔵", "🟡"],
    gridSize: 3,
    intervalMs: 2000,
    timeLimitSeconds: 60,
    targetCount: 3,
  },
  medium: {
    targetEmoji: "⭐",
    distractorEmojis: ["🔵", "🟡", "🟢", "🔴"],
    gridSize: 4,
    intervalMs: 1200,
    timeLimitSeconds: 45,
    targetCount: 4,
  },
  hard: {
    targetEmoji: "⭐",
    distractorEmojis: ["🔵", "🟡", "🟢", "🔴", "🟣", "🟠"],
    gridSize: 5,
    intervalMs: 700,
    timeLimitSeconds: 30,
    targetCount: 5,
  },
};

// ── Photo Puzzle configs
const photo_puzzle: Record<Difficulty, PhotoPuzzleConfig> = {
  easy: {
    gridSize: 2,
    pieceCount: 4,
    showGhostGuide: true,
    allowRotation: false,
    timeLimitSeconds: null,
  },
  medium: {
    gridSize: 3,
    pieceCount: 9,
    showGhostGuide: false,
    allowRotation: false,
    timeLimitSeconds: 120,
  },
  hard: {
    gridSize: 4,
    pieceCount: 16,
    showGhostGuide: false,
    allowRotation: true,
    timeLimitSeconds: 90,
  },
};

// ── Word Puzzle configs
const WORD_PUZZLE: Record<Difficulty, WordPuzzleConfig> = {
  easy: {
    wordLength: 3,
    showLetterHints: true,
    timeLimitSeconds: null,
    scrambled: false,
    words: PUZZLE_WORDS.filter((w) => w.word.length === 3),
  },
  medium: {
    wordLength: 5,
    showLetterHints: false,
    timeLimitSeconds: 60,
    scrambled: false,
    words: PUZZLE_WORDS.filter((w) => w.word.length === 5),
  },
  hard: {
    wordLength: 8,
    showLetterHints: false,
    timeLimitSeconds: 45,
    scrambled: true,
    words: PUZZLE_WORDS.filter((w) => w.word.length === 8),
  },
};

// ── Master lookup — the single function all game screens call ──
export const GAME_CONTENT: Record<GameId, Record<Difficulty, any>> = {
  memory_recall: MEMORY_RECALL,
  object_recall: OBJECT_RECALL,
  attention_game: ATTENTION_GAME,
  photo_puzzle: photo_puzzle,
  word_puzzle: WORD_PUZZLE,
};

export function getGameContent<T>(gameId: GameId, difficulty: Difficulty): T {
  return GAME_CONTENT[gameId][difficulty] as T;
}
