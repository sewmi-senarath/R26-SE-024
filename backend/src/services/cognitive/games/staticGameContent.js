const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { pickDistractors, shuffle } = require("./gameContentUtils");
const { buildTimeOrientationQuestions } = require("./orientationFacts");

const CONTENT_DIR = path.resolve(
  __dirname,
  "../../../../../frontend/src/constants/game-content"
);

function loadFrontendContent(fileName, exportName, fallback) {
  try {
    const source = fs.readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
    const sandbox = {};
    const script = new vm.Script(
      `${source.replace(`export const ${exportName} =`, `const ${exportName} =`)}
module.exports = ${exportName};`
    );

    sandbox.module = { exports: fallback };
    sandbox.exports = sandbox.module.exports;
    script.runInNewContext(sandbox, { timeout: 1000 });

    return Array.isArray(sandbox.module.exports) ? sandbox.module.exports : fallback;
  } catch (error) {
    return fallback;
  }
}

function sampleItems(items, count) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function matchesWordLength(word, wordLength) {
  return wordLength === 8 ? word.length >= 8 : word.length === wordLength;
}

const FALLBACK_SEQUENCE_ITEMS = [
  { id: "s1", emoji: "\u{1F34E}", label: "Apple", category: "Food" },
  { id: "s2", emoji: "\u{1F415}", label: "Dog", category: "Animal" },
  { id: "s3", emoji: "\u{1F697}", label: "Car", category: "Vehicle" },
  { id: "s4", emoji: "\u{1F338}", label: "Flower", category: "Nature" },
  { id: "s5", emoji: "\u{1F4DA}", label: "Book", category: "Object" },
  { id: "s6", emoji: "\u{1F3B5}", label: "Music", category: "Art" },
  { id: "s7", emoji: "\u{1F3E0}", label: "House", category: "Place" },
];

const FALLBACK_RECALL_OBJECTS = [
  { id: "o1", emoji: "\u{1F511}", label: "Keys", category: "Household" },
  { id: "o2", emoji: "\u{1F453}", label: "Glasses", category: "Personal" },
  { id: "o3", emoji: "\u2615", label: "Cup", category: "Household" },
  { id: "o4", emoji: "\u{1F4F1}", label: "Phone", category: "Technology" },
  { id: "o5", emoji: "\u{1F58A}\uFE0F", label: "Pen", category: "Stationery" },
  { id: "o6", emoji: "\u{1F9E6}", label: "Socks", category: "Clothing" },
  { id: "o7", emoji: "\u{1FAB4}", label: "Plant", category: "Nature" },
];

const FALLBACK_PUZZLE_WORDS = [
  { id: "w1", word: "CAT", hint: "A furry pet", category: "Animals" },
  { id: "w2", word: "SUN", hint: "Shines in the sky", category: "Nature" },
  { id: "w3", word: "CUP", hint: "You drink from it", category: "Objects" },
  { id: "w4", word: "APPLE", hint: "A red fruit", category: "Food" },
  { id: "w5", word: "CLOCK", hint: "Shows the time", category: "Objects" },
  { id: "w6", word: "CHAIR", hint: "You sit on it", category: "Furniture" },
  { id: "w7", word: "CALENDAR", hint: "Tracks dates", category: "Objects" },
  { id: "w8", word: "UMBRELLA", hint: "Used in rain", category: "Objects" },
  { id: "w9", word: "ELEPHANT", hint: "Large animal", category: "Animals" },
];

const FALLBACK_FACES = [
  { id: "f1", emoji: "\u{1F471}", name: "Alex" },
  { id: "f2", emoji: "\u{1F469}", name: "Maria" },
  { id: "f3", emoji: "\u{1F468}", name: "Sam" },
  { id: "f4", emoji: "\u{1F475}", name: "Grace" },
  { id: "f5", emoji: "\u{1F474}", name: "John" },
  { id: "f6", emoji: "\u{1F467}", name: "Emma" },
  { id: "f7", emoji: "\u{1F466}", name: "Leo" },
];

function buildFaceQuestions(people, requiredCount, optionsCount) {
  const pool = people.map((p) => p.name);
  const chosen = shuffle(people).slice(0, requiredCount);

  return chosen.map((person, index) => ({
    id: `face${index + 1}`,
    emoji: person.emoji,
    ...(person.image ? { image: person.image } : {}),
    relationLabel: person.relationLabel || "Who is this?",
    correctAnswer: person.name,
    options: shuffle([
      person.name,
      ...pickDistractors(pool, [person.name], optionsCount - 1),
    ]),
  }));
}

const SEQUENCE_ITEMS = loadFrontendContent(
  "sequence_items.ts",
  "SEQUENCE_ITEMS",
  FALLBACK_SEQUENCE_ITEMS
);
const RECALL_OBJECTS = loadFrontendContent(
  "recall_objects.ts",
  "RECALL_OBJECTS",
  FALLBACK_RECALL_OBJECTS
);
const PUZZLE_WORDS = loadFrontendContent(
  "puzzle_words.ts",
  "PUZZLE_WORDS",
  FALLBACK_PUZZLE_WORDS
);

const GAME_CONTENT = {
  memory_recall: {
    easy: {
      sequenceLength: 3,
      displayTimeMs: 3000,
      timeLimitSeconds: 60,
      showHints: true,
    },
    medium: {
      sequenceLength: 5,
      displayTimeMs: 2000,
      timeLimitSeconds: 45,
      showHints: false,
    },
    hard: {
      sequenceLength: 7,
      displayTimeMs: 1000,
      timeLimitSeconds: 30,
      showHints: false,
    },
  },
  object_recall: {
    easy: {
      objectCount: 3,
      displayTimeMs: 8000,
      timeLimitSeconds: 60,
      showCategoryHints: true,
    },
    medium: {
      objectCount: 5,
      displayTimeMs: 10000,
      timeLimitSeconds: 45,
      showCategoryHints: false,
    },
    hard: {
      objectCount: 7,
      displayTimeMs: 15000,
      timeLimitSeconds: 30,
      showCategoryHints: false,
    },
  },
  word_puzzle: {
    easy: {
      wordLength: 3,
      showLetterHints: true,
      timeLimitSeconds: null,
      scrambled: false,
      wordCount: 5,
    },
    medium: {
      wordLength: 5,
      showLetterHints: false,
      timeLimitSeconds: 60,
      scrambled: false,
      wordCount: 5,
    },
    hard: {
      wordLength: 8,
      showLetterHints: false,
      timeLimitSeconds: 45,
      scrambled: true,
      wordCount: 5,
    },
  },
  orientation_game: {
    easy: { questionCount: 4, optionsCount: 3, timeLimitSeconds: null },
    medium: { questionCount: 5, optionsCount: 3, timeLimitSeconds: 30 },
    hard: { questionCount: 6, optionsCount: 4, timeLimitSeconds: 20 },
  },
  face_name_match: {
    easy: { questionCount: 3, optionsCount: 3, timeLimitSeconds: null },
    medium: { questionCount: 4, optionsCount: 3, timeLimitSeconds: 20 },
    hard: { questionCount: 5, optionsCount: 4, timeLimitSeconds: 15 },
  },
};

function buildStaticConfig(gameId, difficulty) {
  const config = GAME_CONTENT[gameId]?.[difficulty];
  if (!config) return null;

  if (gameId === "memory_recall") {
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.sequenceLength),
    };
  }

  if (gameId === "object_recall") {
    return {
      ...config,
      objects: sampleItems(RECALL_OBJECTS, config.objectCount),
    };
  }

  if (gameId === "word_puzzle") {
    const matchingWords = PUZZLE_WORDS.filter(
      (word) => matchesWordLength(word.word, config.wordLength)
    );
    const wordCount = Math.min(config.wordCount, matchingWords.length);
    const { wordCount: _wordCount, ...rest } = config;

    return {
      ...rest,
      words: sampleItems(matchingWords, wordCount),
    };
  }

  if (gameId === "orientation_game") {
    // No profile data available yet — only the deterministic, real-clock
    // time questions are available (no festival/place to personalize with).
    const timeQuestions = buildTimeOrientationQuestions(config.optionsCount);
    const questionCount = Math.min(config.questionCount, timeQuestions.length);
    return {
      ...config,
      questions: timeQuestions.slice(0, questionCount),
    };
  }

  if (gameId === "face_name_match") {
    const questionCount = Math.min(config.questionCount, FALLBACK_FACES.length);
    return {
      ...config,
      questions: buildFaceQuestions(FALLBACK_FACES, questionCount, config.optionsCount),
    };
  }

  return JSON.parse(JSON.stringify(config));
}

function getStaticGameContent(gameId, difficulty) {
  const config = buildStaticConfig(gameId, difficulty);
  return config ? JSON.parse(JSON.stringify(config)) : null;
}

module.exports = {
  GAME_CONTENT,
  getStaticGameContent,
  buildFaceQuestions,
  FALLBACK_FACES,
};
