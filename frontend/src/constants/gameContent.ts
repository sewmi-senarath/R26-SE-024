import {
  AttentionGameConfig,
  Difficulty,
  FaceNameMatchConfig,
  FaceNameQuestion,
  GameId,
  MemoryRecallConfig,
  ObjectRecallConfig,
  OrientationGameConfig,
  OrientationQuestion,
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

function pickDistractors<T>(pool: T[], exclude: T[], count: number): T[] {
  const seen = new Set(exclude.map((v) => String(v).trim().toLowerCase()));
  const candidates: T[] = [];
  pool.forEach((value) => {
    const key = String(value).trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(value);
  });
  return sampleItems(candidates, count);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES_OF_DAY = ["Morning", "Afternoon", "Evening", "Night"];

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

// Deterministic, real-clock questions — never LLM-generated, so "what day is
// it" can never be answered wrong. Mirrors backend/orientationFacts.js.
function buildTimeOrientationQuestions(optionsCount: number): OrientationQuestion[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = MONTHS[now.getMonth()];
  const weekday = WEEKDAYS[now.getDay()];
  const timeOfDay = getTimeOfDay(now.getHours());
  const yearPool = [year - 2, year - 1, year, year + 1, year + 2].map(String);

  const build = (
    id: string,
    question: string,
    icon: string,
    correctAnswer: string,
    pool: string[],
  ): OrientationQuestion => ({
    id,
    question,
    icon,
    category: "Time",
    correctAnswer,
    options: sampleItems(
      [correctAnswer, ...pickDistractors(pool, [correctAnswer], optionsCount - 1)],
      optionsCount,
    ),
  });

  return [
    build("ot-year", "What year is it right now?", "📅", String(year), yearPool),
    build("ot-weekday", "What day of the week is it today?", "📆", weekday, WEEKDAYS),
    build("ot-month", "What month is it right now?", "🗓️", month, MONTHS),
    build("ot-timeofday", "Is it morning, afternoon, evening, or night right now?", "⏰", timeOfDay, TIMES_OF_DAY),
  ];
}

const FALLBACK_FACES: { id: string; emoji: string; name: string }[] = [
  { id: "f1", emoji: "🧑", name: "Alex" },
  { id: "f2", emoji: "👩", name: "Maria" },
  { id: "f3", emoji: "👨", name: "Sam" },
  { id: "f4", emoji: "👵", name: "Grace" },
  { id: "f5", emoji: "👴", name: "John" },
  { id: "f6", emoji: "👧", name: "Emma" },
  { id: "f7", emoji: "👦", name: "Leo" },
];

function buildFaceQuestions(
  people: { id: string; emoji: string; name: string }[],
  requiredCount: number,
  optionsCount: number,
): FaceNameQuestion[] {
  const pool = people.map((p) => p.name);
  const chosen = sampleItems(people, requiredCount);

  return chosen.map((person, index) => ({
    id: `face${index + 1}`,
    emoji: person.emoji,
    relationLabel: "Who is this?",
    correctAnswer: person.name,
    options: sampleItems(
      [person.name, ...pickDistractors(pool, [person.name], optionsCount - 1)],
      optionsCount,
    ),
  }));
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

// orientation_game and face_name_match are always regenerated fresh in
// getGameContent() below (they depend on the real clock / need reshuffling
// each play), so there is no eagerly-built module-level config for them —
// unlike the other five games, nothing here would ever be read.
const ORIENTATION_META: Record<Difficulty, { questionCount: number; optionsCount: number; timeLimitSeconds: number | null }> = {
  easy: { questionCount: 4, optionsCount: 3, timeLimitSeconds: null },
  medium: { questionCount: 5, optionsCount: 3, timeLimitSeconds: 30 },
  hard: { questionCount: 6, optionsCount: 4, timeLimitSeconds: 20 },
};

const FACE_NAME_META: Record<Difficulty, { questionCount: number; optionsCount: number; timeLimitSeconds: number | null }> = {
  easy: { questionCount: 3, optionsCount: 3, timeLimitSeconds: null },
  medium: { questionCount: 4, optionsCount: 3, timeLimitSeconds: 20 },
  hard: { questionCount: 5, optionsCount: 4, timeLimitSeconds: 15 },
};

export const GAME_CONTENT: Record<Exclude<GameId, "orientation_game" | "face_name_match">, Record<Difficulty, any>> = {
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

  if (gameId === "orientation_game") {
    const meta = ORIENTATION_META[difficulty];
    const questions = buildTimeOrientationQuestions(meta.optionsCount).slice(0, meta.questionCount);
    return { ...meta, questions } as T;
  }

  if (gameId === "face_name_match") {
    const meta = FACE_NAME_META[difficulty];
    const questions = buildFaceQuestions(FALLBACK_FACES, meta.questionCount, meta.optionsCount);
    return { ...meta, questions } as T;
  }

  return GAME_CONTENT[gameId][difficulty] as T;
}
