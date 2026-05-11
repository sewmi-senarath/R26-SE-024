import {
  AttentionGameConfig,
  Difficulty,
  GameId,
  MemoryRecallConfig,
  ObjectRecallConfig,
  PhotoPuzzleConfig,
  WordPuzzleConfig,
} from "../types/games.types";
import { SEQUENCE_ITEMS } from "./game-content/sequence_items";
import { PUZZLE_WORDS } from "./game-content/puzzle_words";
import { RECALL_OBJECTS } from "./game-content/recall_objects";

function sampleItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function matchesWordLength(word: string, wordLength: number): boolean {
  return wordLength === 8 ? word.length >= 8 : word.length === wordLength;
}

function buildMemoryRecallConfig(
  sequenceLength: number,
  displayTimeMs: number,
  timeLimitSeconds: number,
  showHints: boolean,
): MemoryRecallConfig {
  return {
    sequenceLength,
    displayTimeMs,
    timeLimitSeconds,
    showHints,
    items: sampleItems(SEQUENCE_ITEMS, sequenceLength),
  };
}

function buildObjectRecallConfig(
  objectCount: number,
  displayTimeMs: number,
  timeLimitSeconds: number,
  showCategoryHints: boolean,
): ObjectRecallConfig {
  return {
    objectCount,
    displayTimeMs,
    timeLimitSeconds,
    showCategoryHints,
    objects: sampleItems(RECALL_OBJECTS, objectCount),
  };
}

function buildWordPuzzleConfig(
  wordLength: number,
  showLetterHints: boolean,
  timeLimitSeconds: number | null,
  scrambled: boolean,
): WordPuzzleConfig {
  const matchingWords = PUZZLE_WORDS.filter((w) =>
    matchesWordLength(w.word, wordLength),
  );

  return {
    wordLength,
    showLetterHints,
    timeLimitSeconds,
    scrambled,
    words: sampleItems(matchingWords, Math.min(5, matchingWords.length)),
  };
}

const MEMORY_RECALL: Record<Difficulty, MemoryRecallConfig> = {
  easy: buildMemoryRecallConfig(3, 3000, 60, true),
  medium: buildMemoryRecallConfig(5, 2000, 45, false),
  hard: buildMemoryRecallConfig(7, 1000, 30, false),
};

const OBJECT_RECALL: Record<Difficulty, ObjectRecallConfig> = {
  easy: buildObjectRecallConfig(3, 8000, 60, true),
  medium: buildObjectRecallConfig(5, 10000, 45, false),
  hard: buildObjectRecallConfig(7, 15000, 30, false),
};

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

const PHOTO_PUZZLE: Record<Difficulty, PhotoPuzzleConfig> = {
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

const WORD_PUZZLE: Record<Difficulty, WordPuzzleConfig> = {
  easy: buildWordPuzzleConfig(3, true, null, false),
  medium: buildWordPuzzleConfig(5, false, 60, false),
  hard: buildWordPuzzleConfig(8, false, 45, true),
};

export const GAME_CONTENT: Record<GameId, Record<Difficulty, any>> = {
  memory_recall: MEMORY_RECALL,
  object_recall: OBJECT_RECALL,
  attention_game: ATTENTION_GAME,
  photo_puzzle: PHOTO_PUZZLE,
  word_puzzle: WORD_PUZZLE,
};

export function getGameContent<T>(gameId: GameId, difficulty: Difficulty): T {
  if (gameId === "memory_recall") {
    const config = GAME_CONTENT[gameId][difficulty] as MemoryRecallConfig;
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.sequenceLength),
    } as T;
  }

  if (gameId === "object_recall") {
    const config = GAME_CONTENT[gameId][difficulty] as ObjectRecallConfig;
    return {
      ...config,
      objects: sampleItems(RECALL_OBJECTS, config.objectCount),
    } as T;
  }

  if (gameId === "word_puzzle") {
    const config = GAME_CONTENT[gameId][difficulty] as WordPuzzleConfig;
    const matchingWords = PUZZLE_WORDS.filter(
      (w) => matchesWordLength(w.word, config.wordLength),
    );
    return {
      ...config,
      words: sampleItems(matchingWords, config.words.length),
    } as T;
  }

  return GAME_CONTENT[gameId][difficulty] as T;
}
