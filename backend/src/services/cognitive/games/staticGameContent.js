const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { pickDistractors, shuffle } = require("./gameContentUtils");
const { buildTimeOrientationQuestions, buildMemoryAnchor } = require("./orientationFacts");

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
    // Each level differs by more than count/time: the `tiers` it draws from
    // (1=recognition, 2=current-state orientation, 3=reasoning), how close the
    // wrong options sit (`distractorSpread`), how much on-screen support the
    // patient gets (`showHints`/`showCategory`/`autoReadAloud`), whether hard
    // recall input replaces the buttons (`answerMode`), and whether a
    // delayed-recall word is woven in (`delayedRecall`).
    easy: {
      questionCount: 4,
      optionsCount: 3,
      timeLimitSeconds: null,
      tiers: [1, 2],
      distractorSpread: "far",
      showHints: true,
      showCategory: true,
      autoReadAloud: true,
      answerMode: "choice",
      delayedRecall: false,
    },
    medium: {
      questionCount: 5,
      optionsCount: 4,
      timeLimitSeconds: 30,
      tiers: [2],
      distractorSpread: "near",
      showHints: false,
      showCategory: true,
      autoReadAloud: false,
      answerMode: "choice",
      delayedRecall: false,
    },
    hard: {
      questionCount: 6,
      optionsCount: 5,
      timeLimitSeconds: 20,
      tiers: [2, 3],
      distractorSpread: "near",
      showHints: false,
      showCategory: false,
      autoReadAloud: false,
      answerMode: "recall",
      delayedRecall: true,
    },
  },
  face_name_match: {
    // Difficulty scales by retrieval depth, not just count/time: easy is pure
    // recognition with unrelated distractors and an errorless first-letter cue;
    // medium studies the album first then recognises against confusable family
    // names; hard studies then does free recall (reveal + self-check).
    easy: {
      questionCount: 3,
      optionsCount: 3,
      timeLimitSeconds: null,
      answerMode: "choice",
      studyPhase: false,
      firstLetterCue: true,
      distractorStyle: "mixed",
    },
    medium: {
      questionCount: 4,
      optionsCount: 4,
      timeLimitSeconds: 20,
      answerMode: "choice",
      studyPhase: true,
      firstLetterCue: false,
      distractorStyle: "sameGender",
    },
    hard: {
      questionCount: 5,
      optionsCount: 4,
      timeLimitSeconds: 15,
      answerMode: "recall",
      studyPhase: true,
      firstLetterCue: false,
      distractorStyle: "sameGender",
    },
  },
  grid_flash: {
    easy: { gridSize: 3, sequenceLength: 3, flashTimeMs: 750, showLabels: true },
    medium: { gridSize: 4, sequenceLength: 5, flashTimeMs: 750, showLabels: false },
    hard: { gridSize: 5, sequenceLength: 7, flashTimeMs: 750, showLabels: false },
  },
  listen_repeat: {
    easy: { wordCount: 3, allowReplay: true, answerMode: "choice" },
    medium: { wordCount: 5, allowReplay: false, answerMode: "choice" },
    hard: { wordCount: 7, allowReplay: false, answerMode: "input" },
  },
  memory_match: {
    easy: { pairCount: 3, columns: 3, peekMs: 3500, moveLimit: null },
    medium: { pairCount: 6, columns: 4, peekMs: 1800, moveLimit: null },
    hard: { pairCount: 8, columns: 4, peekMs: 1200, moveLimit: 24 },
  },
  story_recall: {
    easy: { questionCount: 2, answerMode: "choice", delayMs: 0 },
    medium: { questionCount: 4, answerMode: "choice", delayMs: 0 },
    hard: { questionCount: 6, answerMode: "choice", delayMs: 4000 },
  },
};

// Generic fallback stories for Story Recall when there is no profile to
// personalize from and/or the LLM is unavailable. Every answer is stated in
// the text, so grading is always verifiable.
const STORY_POOL = [
  {
    id: "market-day",
    text:
      "On Saturday morning, Mr. Perera walked to the market near the temple. " +
      "He bought three red apples, a loaf of bread, and a bunch of yellow bananas. " +
      "On the way home he met his old friend Nihal, and they sat on a bench to talk about their grandchildren. " +
      "The sun was warm, and a small brown dog followed them along the road.",
    questions: [
      { question: "What day did Mr. Perera go to the market?", correctAnswer: "Saturday", options: ["Saturday", "Sunday", "Monday", "Friday"] },
      { question: "What was the market near?", correctAnswer: "The temple", options: ["The temple", "The river", "The school", "The hospital"] },
      { question: "How many apples did he buy?", correctAnswer: "Three", options: ["Three", "Two", "Four", "Five"] },
      { question: "Who did he meet on the way home?", correctAnswer: "Nihal", options: ["Nihal", "His brother", "The doctor", "A stranger"] },
      { question: "What colour were the bananas?", correctAnswer: "Yellow", options: ["Yellow", "Green", "Red", "Brown"] },
      { question: "What animal followed them?", correctAnswer: "A dog", options: ["A dog", "A cat", "A bird", "A cow"] },
    ],
  },
  {
    id: "garden-evening",
    text:
      "Mrs. Fernando loved her garden. Every evening she watered the roses and the little lime tree by the gate. " +
      "Her granddaughter Maya often came to help, carrying a small blue watering can. " +
      "One evening they saw a bright butterfly land on a white flower, and Maya laughed with delight. " +
      "Afterwards they had a warm cup of tea on the porch.",
    questions: [
      { question: "What did Mrs. Fernando love?", correctAnswer: "Her garden", options: ["Her garden", "Her car", "Cooking", "Painting"] },
      { question: "What tree was by the gate?", correctAnswer: "A lime tree", options: ["A lime tree", "A mango tree", "An apple tree", "A palm tree"] },
      { question: "Who helped her in the garden?", correctAnswer: "Maya", options: ["Maya", "Nihal", "Her son", "The neighbour"] },
      { question: "What colour was the watering can?", correctAnswer: "Blue", options: ["Blue", "Red", "Green", "Yellow"] },
      { question: "What landed on the flower?", correctAnswer: "A butterfly", options: ["A butterfly", "A bee", "A bird", "A leaf"] },
      { question: "What did they drink afterwards?", correctAnswer: "Tea", options: ["Tea", "Coffee", "Milk", "Water"] },
    ],
  },
  {
    id: "train-trip",
    text:
      "Last month, Mr. and Mrs. Silva took the morning train to Kandy to visit their son. " +
      "They packed sandwiches and a flask of tea for the journey. " +
      "Through the window they watched green hills and a sparkling waterfall pass by. " +
      "When they arrived, their son met them at the station with a big smile and a bunch of flowers.",
    questions: [
      { question: "Where did the Silvas travel to?", correctAnswer: "Kandy", options: ["Kandy", "Galle", "Colombo", "Jaffna"] },
      { question: "Who were they visiting?", correctAnswer: "Their son", options: ["Their son", "Their daughter", "A friend", "The doctor"] },
      { question: "What did they pack to eat?", correctAnswer: "Sandwiches", options: ["Sandwiches", "Rice", "Cake", "Fruit"] },
      { question: "What did they see through the window?", correctAnswer: "A waterfall", options: ["A waterfall", "The sea", "A city", "A desert"] },
      { question: "What time did the train leave?", correctAnswer: "Morning", options: ["Morning", "Evening", "Night", "Noon"] },
      { question: "What did their son bring?", correctAnswer: "Flowers", options: ["Flowers", "A cake", "A book", "An umbrella"] },
    ],
  },
];

// Build a Story Recall round from the generic pool: pick a story, take the
// level's number of questions, and shuffle each question's options.
function buildStaticStoryConfig(config) {
  const story = STORY_POOL[Math.floor(Math.random() * STORY_POOL.length)];
  const picked = sampleItems(story.questions, Math.min(config.questionCount, story.questions.length));
  return {
    ...config,
    questionCount: picked.length,
    story: story.text,
    questions: picked.map((q, i) => ({
      id: `sq${i}`,
      question: q.question,
      correctAnswer: q.correctAnswer,
      options: sampleItems(q.options, q.options.length),
    })),
  };
}

function buildStaticConfig(gameId, difficulty) {
  const config = GAME_CONTENT[gameId]?.[difficulty];
  if (!config) return null;

  if (gameId === "memory_recall") {
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.sequenceLength),
    };
  }

  if (gameId === "grid_flash") {
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.sequenceLength),
    };
  }

  if (gameId === "listen_repeat") {
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.wordCount),
    };
  }

  if (gameId === "memory_match") {
    return {
      ...config,
      items: sampleItems(SEQUENCE_ITEMS, config.pairCount),
    };
  }

  if (gameId === "story_recall") {
    return buildStaticStoryConfig(config);
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
    // No profile data available yet - only the deterministic, real-clock
    // time questions are available (no festival/place to personalize with).
    const timeQuestions = buildTimeOrientationQuestions(config.optionsCount, {
      tiers: config.tiers,
      spread: config.distractorSpread,
    });

    // On hard the last slot is reserved for a delayed-recall word shown up front.
    const recall = config.delayedRecall ? buildMemoryAnchor(config.optionsCount) : null;
    const slotsForTime = recall ? config.questionCount - 1 : config.questionCount;
    const chosen = timeQuestions.slice(0, Math.max(1, Math.min(slotsForTime, timeQuestions.length)));
    const questions = recall ? [...chosen, recall.question] : chosen;

    return {
      ...config,
      questions,
      ...(recall ? { memoryAnchor: recall.anchor } : {}),
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
  SEQUENCE_ITEMS,
  RECALL_OBJECTS,
  PUZZLE_WORDS,
};
