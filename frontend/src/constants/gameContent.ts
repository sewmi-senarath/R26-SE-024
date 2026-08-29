import {
  AttentionGameConfig,
  Difficulty,
  FaceNameMatchConfig,
  FaceNameQuestion,
  GameId,
  GridFlashConfig,
  ListenRepeatConfig,
  MemoryMatchConfig,
  MemoryRecallConfig,
  StoryRecallConfig,
  ObjectRecallConfig,
  OrientationGameConfig,
  OrientationQuestion,
  PhotoPuzzleConfig,
  WordPuzzleConfig,
} from "../types/games.types";
import { SEQUENCE_ITEMS } from "./game-content/sequence_items";
import { PUZZLE_WORDS } from "./game-content/puzzle_words";
import { RECALL_OBJECTS } from "./game-content/recall_objects";
import { STORY_POOL } from "./game-content/story_content";

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

// How many decoy options pad the Memory Recall grid beyond the correct items.
const MEMORY_RECALL_DISTRACTOR_COUNT = 3;

// Pick decoys from the shared pool, excluding anything already chosen as a
// correct item, so the recall grid never shows the same object twice.
function sampleMemoryDistractors(
  chosen: { label: string }[],
  count: number,
): (typeof SEQUENCE_ITEMS)[number][] {
  const used = new Set(chosen.map((i) => i.label.trim().toLowerCase()));
  const pool = SEQUENCE_ITEMS.filter(
    (i) => !used.has(i.label.trim().toLowerCase()),
  );
  return sampleItems(pool, count).map((item, idx) => ({
    ...item,
    id: `distractor_${idx}_${item.id}`,
  }));
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

interface OrientationBuildOpts {
  tiers?: number[];
  spread?: "near" | "far";
}

// Neighbours of `correct` within an ordered list - mirrors backend so "near"
// distractors are genuinely tempting (e.g. Monday next to Sunday/Tuesday).
function orderedNeighbours(list: string[], correct: string, count: number): string[] {
  const index = list.indexOf(correct);
  if (index === -1) return pickDistractors(list, [correct], count);
  const out: string[] = [];
  for (let distance = 1; out.length < count && distance < list.length; distance += 1) {
    const before = list[(index - distance + list.length) % list.length];
    const after = list[(index + distance) % list.length];
    if (before !== correct && !out.includes(before)) out.push(before);
    if (out.length >= count) break;
    if (after !== correct && !out.includes(after)) out.push(after);
  }
  return out.slice(0, count);
}

const RECALL_WORDS = [
  "Sunflower", "Elephant", "Rainbow", "Mountain", "River",
  "Garden", "Butterfly", "Lantern", "Umbrella", "Harbour",
];

// Deterministic, real-clock questions - never LLM-generated, so "what day is
// it" can never be answered wrong. Mirrors backend/orientationFacts.js: each
// item is tagged with a cognitive tier (1=recognition, 2=orientation,
// 3=reasoning) and honours the requested tier set + distractor spread.
function buildTimeOrientationQuestions(
  optionsCount: number,
  opts: OrientationBuildOpts = {},
): OrientationQuestion[] {
  const { tiers = [1, 2, 3], spread = "far" } = opts;
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = MONTHS[monthIndex];
  const dayIndex = now.getDay();
  const weekday = WEEKDAYS[dayIndex];
  const dateOfMonth = now.getDate();
  const hour = now.getHours();
  const timeOfDay = getTimeOfDay(hour);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Nearby years are all tempting, so keep four either way - this also ensures
  // enough options for the higher medium/hard option counts.
  const yearPool = [year - 2, year - 1, year + 1, year + 2].map(String);

  const tomorrow = WEEKDAYS[(dayIndex + 1) % 7];
  const yesterday = WEEKDAYS[(dayIndex + 6) % 7];
  const dayAfterTomorrow = WEEKDAYS[(dayIndex + 2) % 7];
  const nextMonth = MONTHS[(monthIndex + 1) % 12];
  const twoMonthsAgo = MONTHS[(monthIndex + 10) % 12];
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  const choice = (
    id: string,
    question: string,
    icon: string,
    correctAnswer: string,
    pool: string[],
    tier: 1 | 2 | 3,
    extra: {
      hint?: string;
      numeric?: boolean;
      category?: OrientationQuestion["category"];
      numericRange?: { min: number; max: number };
    } = {},
  ): OrientationQuestion => {
    const distractors =
      spread === "near"
        ? orderedNeighbours(pool, correctAnswer, optionsCount - 1)
        : pickDistractors(pool, [correctAnswer], optionsCount - 1);
    return {
      id,
      question,
      icon,
      category: extra.category ?? "Time",
      correctAnswer,
      options: sampleItems([correctAnswer, ...distractors], optionsCount),
      tier,
      ...(extra.hint ? { hint: extra.hint } : {}),
      ...(extra.numeric ? { numeric: true } : {}),
      ...(extra.numericRange ? { numericRange: extra.numericRange } : {}),
    };
  };

  const number = (
    id: string,
    question: string,
    icon: string,
    answer: number,
    pool: number[],
    tier: 1 | 2 | 3,
    range?: { min: number; max: number },
  ): OrientationQuestion => ({
    id,
    question,
    icon,
    category: "Time",
    correctAnswer: String(answer),
    options: sampleItems(
      [String(answer), ...pickDistractors(pool.map(String), [String(answer)], optionsCount - 1)],
      optionsCount,
    ),
    tier,
    numeric: true,
    ...(range ? { numericRange: range } : {}),
  });

  const numberNeighbours = (id: string, question: string, icon: string, answer: number, min: number, max: number, tier: 1 | 2 | 3, range?: { min: number; max: number }): OrientationQuestion => {
    const maxDelta = spread === "near" ? 2 : 4;
    const minDelta = spread === "near" ? 1 : 2;
    const pool: number[] = [];
    for (let delta = -maxDelta; delta <= maxDelta; delta += 1) {
      if (delta === 0 || Math.abs(delta) < minDelta) continue;
      const value = answer + delta;
      if (value >= min && value <= max) pool.push(value);
    }
    return number(id, question, icon, answer, pool, tier, range);
  };

  const all: OrientationQuestion[] = [
    // Tier 2 - current date & time awareness
    choice("ot-year", "What year is it right now?", "📅", String(year), yearPool, 2, {
      numeric: true,
      numericRange: { min: year - 5, max: year + 5 },
      hint: "Think about the year we are living in now.",
    }),
    choice("ot-weekday", "What day of the week is it today?", "📆", weekday, WEEKDAYS, 2, {
      hint: "Think about what you did today or have planned.",
    }),
    choice("ot-month", "What month is it right now?", "🗓️", month, MONTHS, 2, {
      hint: "Think about the season and any recent festivals.",
    }),
    choice("ot-timeofday", "Is it morning, afternoon, evening, or night right now?", "⏰", timeOfDay, TIMES_OF_DAY, 2, {
      hint: "Look at how light or dark it is outside.",
    }),
    numberNeighbours("ot-dateofmonth", "What is today's date (the day of the month)?", "📅", dateOfMonth, 1, 31, 2, { min: 1, max: 31 }),
    choice("ot-ampm", "Right now, is the time AM (before noon) or PM (after noon)?", "🕛", hour < 12 ? "AM" : "PM", ["AM", "PM"], 2),
    choice("ot-weekpart", "Is today a weekday or part of the weekend?", "📆", isWeekend ? "Weekend" : "Weekday", ["Weekday", "Weekend"], 2),

    // Tier 3 - reasoning about the calendar
    choice("ot-tomorrow", `Today is ${weekday}. Which day comes tomorrow?`, "➡️", tomorrow, WEEKDAYS, 3, { category: "Calendar" }),
    choice("ot-yesterday", `Today is ${weekday}. Which day was yesterday?`, "⬅️", yesterday, WEEKDAYS, 3, { category: "Calendar" }),
    choice("ot-day-after-tomorrow", `Today is ${weekday}. Which day will it be the day after tomorrow?`, "⏩", dayAfterTomorrow, WEEKDAYS, 3, { category: "Calendar" }),
    choice("ot-nextmonth", `It is ${month} now. Which month comes next?`, "🗓️", nextMonth, MONTHS, 3, { category: "Calendar" }),
    choice("ot-two-months-ago", `It is ${month} now. Which month was it two months ago?`, "⏪", twoMonthsAgo, MONTHS, 3, { category: "Calendar" }),
    numberNeighbours("ot-daysinmonth", `How many days does ${month} have this year?`, "📆", daysInMonth, 28, 31, 3, { min: 28, max: 31 }),

    // Tier 1 - general knowledge
    number("ot-days-in-week", "How many days are there in one week?", "🗓️", 7, [5, 6, 7, 8, 10], 1),
    number("ot-months-in-year", "How many months are there in one year?", "📅", 12, [10, 11, 12, 13, 14], 1),
    number("ot-hours-in-day", "How many hours are there in one day?", "⏰", 24, [12, 20, 24, 30, 48], 1),
    choice("ot-dayorder", "Which comes first in a day - morning or evening?", "🌅", "Morning", ["Morning", "Evening"], 1),
  ];

  const tierSet = new Set(tiers);
  const selected = all.filter((q) => q.tier && tierSet.has(q.tier));
  return sampleItems(selected.length ? selected : all, selected.length ? selected.length : all.length);
}

function buildMemoryAnchor(optionsCount: number) {
  const word = RECALL_WORDS[Math.floor(Math.random() * RECALL_WORDS.length)];
  const question: OrientationQuestion = {
    id: "ot-recall",
    question: "Which word were you asked to remember at the start?",
    icon: "🧠",
    category: "Memory",
    correctAnswer: word,
    options: sampleItems([word, ...pickDistractors(RECALL_WORDS, [word], optionsCount - 1)], optionsCount),
    tier: 3,
  };
  const anchor = {
    word,
    icon: "🧠",
    statement: `Please remember this word. We will ask for it again at the end: ${word}`,
  };
  return { anchor, question };
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

// Grid Flash: a spatial sequence over an N×N grid. Flash speed is deliberately
// constant across levels - only the grid size and sequence length grow.
function buildGridFlashConfig(
  gridSize: number,
  sequenceLength: number,
  showLabels: boolean,
): GridFlashConfig {
  return {
    gridSize,
    sequenceLength,
    flashTimeMs: 750,
    showLabels,
    items: sampleItems(SEQUENCE_ITEMS, sequenceLength),
  };
}

const GRID_FLASH: Record<Difficulty, GridFlashConfig> = {
  easy: buildGridFlashConfig(3, 3, true),
  medium: buildGridFlashConfig(4, 5, false),
  hard: buildGridFlashConfig(5, 7, false),
};

// Listen & Repeat: words are spoken, then recognised (choice) or typed (input).
function buildListenRepeatConfig(
  wordCount: number,
  allowReplay: boolean,
  answerMode: "choice" | "input",
): ListenRepeatConfig {
  const items = sampleItems(SEQUENCE_ITEMS, wordCount);
  return {
    wordCount,
    allowReplay,
    answerMode,
    items,
    distractors: sampleMemoryDistractors(items, wordCount),
  };
}

const LISTEN_REPEAT: Record<Difficulty, ListenRepeatConfig> = {
  easy: buildListenRepeatConfig(3, true, "choice"),
  medium: buildListenRepeatConfig(5, false, "choice"),
  hard: buildListenRepeatConfig(7, false, "input"),
};

// Memory Match: pairs of personalized items over a flip-card grid.
function buildMemoryMatchConfig(
  pairCount: number,
  columns: number,
  peekMs: number,
  moveLimit: number | null,
): MemoryMatchConfig {
  return {
    pairCount,
    columns,
    peekMs,
    moveLimit,
    items: sampleItems(SEQUENCE_ITEMS, pairCount),
  };
}

const MEMORY_MATCH: Record<Difficulty, MemoryMatchConfig> = {
  easy: buildMemoryMatchConfig(3, 3, 3500, null),
  medium: buildMemoryMatchConfig(6, 4, 1800, null),
  hard: buildMemoryMatchConfig(8, 4, 1200, 24),
};

// Story Recall: pick a generic story and slice it to the level's question count.
// (Personalized stories come from the backend LLM; this is the offline fallback.)
function buildStoryRecallConfig(
  questionCount: number,
  answerMode: "choice" | "mixed",
  delayMs: number,
): StoryRecallConfig {
  const story = STORY_POOL[Math.floor(Math.random() * STORY_POOL.length)];
  const chosen = sampleItems(story.questions, Math.min(questionCount, story.questions.length));
  return {
    questionCount: chosen.length,
    answerMode,
    delayMs,
    story: story.text,
    questions: chosen.map((q, i) => ({
      id: `sq${i}`,
      question: q.question,
      correctAnswer: q.correctAnswer,
      options: sampleItems(q.options, q.options.length),
    })),
  };
}

const STORY_RECALL: Record<Difficulty, StoryRecallConfig> = {
  easy: buildStoryRecallConfig(2, "choice", 0),
  medium: buildStoryRecallConfig(4, "choice", 0),
  hard: buildStoryRecallConfig(6, "choice", 4000),
};

// orientation_game and face_name_match are always regenerated fresh in
// getGameContent() below (they depend on the real clock / need reshuffling
// each play), so there is no eagerly-built module-level config for them -
// unlike the other five games, nothing here would ever be read.
type OrientationMeta = Omit<OrientationGameConfig, "questions" | "memoryAnchor">;
const ORIENTATION_META: Record<Difficulty, OrientationMeta> = {
  easy: {
    questionCount: 4, optionsCount: 3, timeLimitSeconds: null,
    tiers: [1, 2], distractorSpread: "far",
    showHints: true, showCategory: true, autoReadAloud: true,
    answerMode: "choice", delayedRecall: false,
  },
  medium: {
    questionCount: 5, optionsCount: 4, timeLimitSeconds: 30,
    tiers: [2], distractorSpread: "near",
    showHints: false, showCategory: true, autoReadAloud: false,
    answerMode: "choice", delayedRecall: false,
  },
  hard: {
    questionCount: 6, optionsCount: 5, timeLimitSeconds: 20,
    tiers: [2, 3], distractorSpread: "near",
    showHints: false, showCategory: false, autoReadAloud: false,
    answerMode: "recall", delayedRecall: true,
  },
};

type FaceNameMeta = Omit<FaceNameMatchConfig, "questions">;
const FACE_NAME_META: Record<Difficulty, FaceNameMeta> = {
  easy: {
    questionCount: 3, optionsCount: 3, timeLimitSeconds: null,
    answerMode: "choice", studyPhase: false, firstLetterCue: true, distractorStyle: "mixed",
  },
  medium: {
    questionCount: 4, optionsCount: 4, timeLimitSeconds: 20,
    answerMode: "choice", studyPhase: true, firstLetterCue: false, distractorStyle: "sameGender",
  },
  hard: {
    questionCount: 5, optionsCount: 4, timeLimitSeconds: 15,
    answerMode: "recall", studyPhase: true, firstLetterCue: false, distractorStyle: "sameGender",
  },
};

export const GAME_CONTENT: Record<Exclude<GameId, "orientation_game" | "face_name_match">, Record<Difficulty, any>> = {
  memory_recall: MEMORY_RECALL,
  object_recall: OBJECT_RECALL,
  attention_game: ATTENTION_GAME,
  photo_puzzle: PHOTO_PUZZLE,
  word_puzzle: WORD_PUZZLE,
  grid_flash: GRID_FLASH,
  listen_repeat: LISTEN_REPEAT,
  memory_match: MEMORY_MATCH,
  story_recall: STORY_RECALL,
};

export function getGameContent<T>(gameId: GameId, difficulty: Difficulty): T {
  if (gameId === "memory_recall") {
    const config = GAME_CONTENT[gameId][difficulty] as MemoryRecallConfig;
    const items = sampleItems(SEQUENCE_ITEMS, config.sequenceLength);
    return {
      ...config,
      items,
      distractors: sampleMemoryDistractors(items, MEMORY_RECALL_DISTRACTOR_COUNT),
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

  if (gameId === "grid_flash") {
    const config = GAME_CONTENT[gameId][difficulty] as GridFlashConfig;
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.sequenceLength),
    } as T;
  }

  if (gameId === "listen_repeat") {
    const config = GAME_CONTENT[gameId][difficulty] as ListenRepeatConfig;
    const items = sampleItems(SEQUENCE_ITEMS, config.wordCount);
    return {
      ...config,
      items,
      distractors: sampleMemoryDistractors(items, config.wordCount),
    } as T;
  }

  if (gameId === "memory_match") {
    const config = GAME_CONTENT[gameId][difficulty] as MemoryMatchConfig;
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.pairCount),
    } as T;
  }

  if (gameId === "story_recall") {
    const config = GAME_CONTENT[gameId][difficulty] as StoryRecallConfig;
    return buildStoryRecallConfig(
      config.questionCount,
      config.answerMode,
      config.delayMs,
    ) as T;
  }

  if (gameId === "orientation_game") {
    const meta = ORIENTATION_META[difficulty];
    const timeQuestions = buildTimeOrientationQuestions(meta.optionsCount, {
      tiers: meta.tiers,
      spread: meta.distractorSpread,
    });
    const recall = meta.delayedRecall ? buildMemoryAnchor(meta.optionsCount) : null;
    const slots = recall ? meta.questionCount - 1 : meta.questionCount;
    const chosen = timeQuestions.slice(0, Math.max(1, slots));
    const questions = recall ? [...chosen, recall.question] : chosen;
    return {
      ...meta,
      questions,
      ...(recall ? { memoryAnchor: recall.anchor } : {}),
    } as T;
  }

  if (gameId === "face_name_match") {
    const meta = FACE_NAME_META[difficulty];
    const questions = buildFaceQuestions(FALLBACK_FACES, meta.questionCount, meta.optionsCount);
    return { ...meta, questions } as T;
  }

  return GAME_CONTENT[gameId][difficulty] as T;
}
