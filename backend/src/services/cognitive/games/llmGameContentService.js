const OpenAI = require("openai");
const englishWords = require("an-array-of-english-words");
const config = require("../../../config/config");

const ENGLISH_WORD_SET = new Set(englishWords);

const VALID_GAMES = new Set(["memory_recall", "object_recall", "word_puzzle"]);
const MAX_LABEL_LENGTH = 24;
const MAX_HINT_LENGTH = 60;
const BLOCKED_TERMS = [
  "death",
  "funeral",
  "accident",
  "war",
  "violence",
  "abuse",
  "cancer",
  "dementia",
  "alzheimer",
  "hospitalization",
  "trauma",
  "politics",
];

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

let client;

function getClient() {
  if (!config.groqApiKey) return null;
  if (!client) {
    // Groq hosts open-weight models (Llama 3.3, etc.) behind an
    // OpenAI-compatible API, so the OpenAI SDK works with a custom baseURL.
    client = new OpenAI({ apiKey: config.groqApiKey, baseURL: GROQ_BASE_URL });
  }
  return client;
}

function compactStrings(values) {
  return (values || [])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function splitFreeText(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function containsBlockedTerm(value) {
  const normalized = normalizeKey(value);
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

function stripUnsafeItem(item) {
  const label = cleanText(item?.label, MAX_LABEL_LENGTH);
  const category = cleanText(item?.category, MAX_LABEL_LENGTH);

  if (!label || !category) return null;
  if (containsBlockedTerm(label) || containsBlockedTerm(category)) return null;

  return {
    id: "",
    emoji: cleanText(item?.emoji, 8) || "•",
    label,
    category,
  };
}

function stripUnsafeWord(item, wordLength) {
  const word = String(item?.word || "").replace(/[^a-z]/gi, "").toUpperCase();
  const hint = cleanText(item?.hint, MAX_HINT_LENGTH);
  const category = cleanText(item?.category, MAX_LABEL_LENGTH);

  const matchesLength = wordLength === 8 ? word.length >= 8 : word.length === wordLength;
  if (!word || !matchesLength || !hint || !category) return null;
  if (!ENGLISH_WORD_SET.has(word.toLowerCase())) return null;
  if (containsBlockedTerm(word) || containsBlockedTerm(hint) || containsBlockedTerm(category)) {
    return null;
  }

  return {
    id: "",
    word,
    hint,
    category,
  };
}

function uniqueByKey(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeKey(getKey(item));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeItems(items, requiredCount, prefix) {
  return uniqueByKey(
    (items || []).map(stripUnsafeItem).filter(Boolean),
    (item) => item.label
  )
    .slice(0, requiredCount)
    .map((item, index) => ({ ...item, id: `${prefix}${index + 1}` }));
}

function normalizeWords(words, requiredCount, wordLength) {
  return uniqueByKey(
    (words || []).map((item) => stripUnsafeWord(item, wordLength)).filter(Boolean),
    (item) => item.word
  )
    .slice(0, requiredCount)
    .map((item, index) => ({ ...item, id: `lw${index + 1}` }));
}

function profileSummary(patient) {
  return {
    age: patient?.age || null,
    preferredLanguage: patient?.preferredLanguage || null,
    cognitiveLevel: patient?.cognitiveLevel || null,
    hometown: patient?.hometown || null,
    hobbies: compactStrings(patient?.hobbies).slice(0, 6),
    interests: compactStrings(patient?.interests).slice(0, 6),
    familyMembers: (patient?.familyMembers || [])
      .filter((member) => member?.name)
      .slice(0, 8)
      .map((member) => ({
        name: cleanText(member.name, MAX_LABEL_LENGTH),
        relation: cleanText(member.relation, MAX_LABEL_LENGTH),
      })),
    lifeEvents: (patient?.lifeEvents || [])
      .filter((event) => event?.title)
      .slice(0, 6)
      .map((event) => cleanText(event.title, MAX_HINT_LENGTH)),
    countriesLived: compactStrings(patient?.countriesLived).slice(0, 6),
    occupations: compactStrings(patient?.occupations).slice(0, 6),
    favoritePlaces: [
      ...compactStrings(patient?.favoritePlaces),
      ...splitFreeText(patient?.favoritePlacesText),
    ].slice(0, 8),
    festivalsCelebrated: compactStrings(patient?.festivalsCelebrated).slice(0, 6),
    foodsPreferred: (patient?.foodsPreferred || [])
      .map((food) => cleanText(food?.name, MAX_LABEL_LENGTH))
      .filter(Boolean)
      .slice(0, 8),
    preferredSports: [
      ...compactStrings(patient?.preferredSports),
      ...splitFreeText(patient?.preferredSportsText),
    ].slice(0, 6),
    languagesPreferred: compactStrings(patient?.languagesPreferred).slice(0, 6),
  };
}

function getRequiredCount(gameId, staticConfig) {
  if (gameId === "memory_recall") return staticConfig.sequenceLength;
  if (gameId === "object_recall") return staticConfig.objectCount;
  return Math.min(5, staticConfig.words?.length || 5);
}

function getSchemaDescription(gameId, staticConfig) {
  if (gameId === "word_puzzle") {
    const lengthRule =
      staticConfig.wordLength === 8
        ? "at least 8 letters"
        : `exactly ${staticConfig.wordLength} letters`;
    return (
      'Respond with JSON of the exact shape {"words": [{"word": string, "hint": string, "category": string}, ...]}. ' +
      `"word" must be a real, correctly spelled, common English dictionary word, alphabetic, uppercase, with ${lengthRule}. ` +
      "Never truncate, pad, or invent a word just to match the length - if no themed word of that exact length comes " +
      "to mind, use any common everyday word of that length instead. " +
      '"hint" is a gentle clue under 60 characters. No other top-level keys.'
    );
  }

  const key = gameId === "memory_recall" ? "items" : "objects";
  return (
    `Respond with JSON of the exact shape {"${key}": [{"emoji": string, "label": string, "category": string}, ...]}. ` +
    '"emoji" is one friendly emoji. "label" is a short familiar word or two. "category" is simple, e.g. Family, Food, Place, Festival, Object. ' +
    'No other top-level keys.'
  );
}

function buildPrompt({ gameId, difficulty, patient, staticConfig }) {
  const count = getRequiredCount(gameId, staticConfig);
  const baseRules = [
    "Generate dementia-friendly cognitive game content for an older patient.",
    "Use familiar, positive, everyday content only.",
    "Avoid distressing, medical, political, violent, or traumatic themes.",
    "Prefer patient-specific interests when they are suitable, but do not invent private facts.",
    "If the patient's profile lists festivals they celebrate (e.g. Vesak, Christmas, Eid, Deepavali), " +
      "weave in some items themed around that festival (e.g. for Vesak: lantern, oil lamp, temple, alms) " +
      "alongside the rest of the familiar content.",
    "Use simple English labels unless the patient profile strongly suggests another language.",
    `Difficulty: ${difficulty}. Required count: ${count}.`,
  ];

  if (gameId === "memory_recall") {
    baseRules.push("Return memorable sequence items. Labels must be short and easy to recognize.");
  } else if (gameId === "object_recall") {
    baseRules.push("Return concrete everyday objects that can be studied and later recalled.");
  } else {
    baseRules.push(
      `Return simple word puzzle answers. ${
        staticConfig.wordLength === 8
          ? "Each word must have at least 8 letters."
          : `Each word must have exactly ${staticConfig.wordLength} letters.`
      }`
    );
  }

  const system = `${baseRules.join("\n")}\n\n${getSchemaDescription(gameId, staticConfig)}\nRespond with JSON only, no prose.`;
  const user = `Patient profile summary:\n${JSON.stringify(profileSummary(patient), null, 2)}`;

  return { system, user };
}

function extractResponseJson(response) {
  const text = response?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("LLM response did not contain text output.");
  }
  return JSON.parse(text);
}

function normalizeGeneratedContent(gameId, parsed, staticConfig) {
  const requiredCount = getRequiredCount(gameId, staticConfig);

  if (gameId === "memory_recall") {
    const items = normalizeItems(parsed.items, requiredCount, "lm");
    if (items.length < requiredCount) return null;
    return { items };
  }

  if (gameId === "object_recall") {
    const objects = normalizeItems(parsed.objects, requiredCount, "lo");
    if (objects.length < requiredCount) return null;
    return { objects };
  }

  const words = normalizeWords(parsed.words, requiredCount, staticConfig.wordLength);
  if (words.length < requiredCount) return null;
  return { words };
}

async function generateLlmGameContent({ gameId, difficulty, patient, staticConfig }) {
  if (!VALID_GAMES.has(gameId)) return null;

  const groq = getClient();
  if (!groq) return null;

  const { system, user } = buildPrompt({ gameId, difficulty, patient, staticConfig });

  const response = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  return normalizeGeneratedContent(gameId, extractResponseJson(response), staticConfig);
}

// Narrow, low-risk LLM calls used by orientation_game and face_name_match.
// Unlike generateLlmGameContent, these NEVER supply a "correct answer" -
// only extra wrong-answer options - so a hallucination can at worst make a
// distractor odd, never make the quiz factually wrong.

async function generateOrientationDistractors({ patient }) {
  const groq = getClient();
  if (!groq) return null;

  const system = [
    "You suggest gentle, plausible WRONG multiple-choice options for a dementia-friendly orientation quiz.",
    "Never suggest anything distressing, medical, political, violent, or traumatic.",
    'Respond with JSON only: {"cityDistractors": [3 to 5 real town or city names, ideally near the patient\'s region], "festivalDistractors": [3 to 5 real festival names the patient does NOT celebrate]}.',
  ].join("\n");

  const user = `Patient context:\n${JSON.stringify(
    {
      hometown: cleanText(patient?.hometown, MAX_LABEL_LENGTH),
      countriesLived: compactStrings(patient?.countriesLived).slice(0, 4),
      languagesPreferred: compactStrings(patient?.languagesPreferred).slice(0, 4),
      festivalsCelebrated: compactStrings(patient?.festivalsCelebrated).slice(0, 6),
    },
    null,
    2
  )}`;

  const response = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const parsed = extractResponseJson(response);
  const cleanList = (values) =>
    (values || [])
      .map((value) => cleanText(value, MAX_LABEL_LENGTH))
      .filter((value) => value && !containsBlockedTerm(value));

  return {
    cityDistractors: cleanList(parsed.cityDistractors),
    festivalDistractors: cleanList(parsed.festivalDistractors),
  };
}

async function generateFaceNameDecoys({ patient, realNames }) {
  const groq = getClient();
  if (!groq) return null;

  const system = [
    'You suggest plausible, culturally-fitting first names for decoy "wrong answer" options in a ' +
      '"who is this family member" photo-matching game for a dementia patient.',
    "The names must NOT be any of the patient's real family member names (listed below) and must not be joke or offensive names.",
    'Respond with JSON only: {"decoyNames": [6 to 10 first names]}.',
  ].join("\n");

  const user = `Real family names to avoid reusing: ${JSON.stringify(realNames)}\nPatient context: ${JSON.stringify(
    {
      hometown: cleanText(patient?.hometown, MAX_LABEL_LENGTH),
      countriesLived: compactStrings(patient?.countriesLived).slice(0, 4),
      languagesPreferred: compactStrings(patient?.languagesPreferred).slice(0, 4),
    }
  )}`;

  const response = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const parsed = extractResponseJson(response);
  const realSet = new Set((realNames || []).map((name) => name.trim().toLowerCase()));

  return (parsed.decoyNames || [])
    .map((value) => cleanText(value, 20))
    .filter((value) => value && !containsBlockedTerm(value) && !realSet.has(value.toLowerCase()));
}

// Turn a batch of game items into short, concrete visual descriptions for a
// text-to-image model. One Groq call per batch keeps it cheap. `items` is
// [{ term, category, hint }]. Returns a plain object mapping term -> visual
// description, or {} on any failure so callers can fall back to a heuristic.
async function generateImagePrompts(items) {
  const groq = getClient();
  if (!groq || !Array.isArray(items) || !items.length) return {};

  const list = items
    .map((it) => ({
      term: cleanText(it.term, MAX_LABEL_LENGTH),
      category: cleanText(it.category, MAX_LABEL_LENGTH),
      hint: cleanText(it.hint, MAX_HINT_LENGTH),
    }))
    .filter((it) => it.term);
  if (!list.length) return {};

  const system = [
    "You write short, concrete visual descriptions for a text-to-image model.",
    "Each description illustrates ONE everyday object or simple scene for a flashcard shown to elderly dementia patients.",
    "Rules: depict a single, clear, instantly recognizable subject, plainly and literally. No people's faces, no text or writing in the image, nothing abstract, medical, or distressing. 6 to 14 words each.",
    'Respond with JSON only: {"prompts": {"<term>": "<visual description>", ...}} reusing each term below verbatim as the key.',
  ].join("\n");

  const user = `Items:\n${JSON.stringify(list, null, 2)}`;

  const response = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const parsed = extractResponseJson(response);
  const prompts =
    parsed && parsed.prompts && typeof parsed.prompts === "object" ? parsed.prompts : {};

  const out = {};
  Object.keys(prompts).forEach((key) => {
    const desc = cleanText(prompts[key], 120);
    if (desc && !containsBlockedTerm(desc)) out[key] = desc;
  });
  return out;
}

// Build a short, warm, personalized story plus verifiable questions for the
// Story Recall game. The story is woven from the patient's own life events
// (plus family, places, hobbies) and every question's answer is stated in the
// text. Returns { story, questions } or null on any problem (caller falls back
// to a generic story).
async function generateStoryRecall({ patient, staticConfig }) {
  const groq = getClient();
  if (!groq) return null;

  const questionCount = staticConfig?.questionCount || 3;
  // Roughly one sentence more than half the questions, scaled by level.
  const sentenceTarget = Math.max(3, questionCount + 1);

  const facts = {
    lifeEvents: (patient?.lifeEvents || [])
      .map((e) => cleanText(e?.title, 80))
      .filter(Boolean)
      .slice(0, 6),
    family: (patient?.familyMembers || [])
      .filter((m) => m?.name)
      .map((m) => ({ name: cleanText(m.name, 40), relation: cleanText(m.relation, 30) }))
      .slice(0, 6),
    hometown: cleanText(patient?.hometown, MAX_LABEL_LENGTH),
    hobbies: compactStrings(patient?.hobbies).slice(0, 5),
    interests: compactStrings(patient?.interests).slice(0, 5),
    occupations: compactStrings(patient?.occupations).slice(0, 3),
    favoritePlaces: compactStrings(patient?.favoritePlaces).slice(0, 5),
    festivals: compactStrings(patient?.festivalsCelebrated).slice(0, 5),
    foods: (patient?.foodsPreferred || [])
      .map((f) => cleanText(f?.name || f, 40))
      .filter(Boolean)
      .slice(0, 5),
  };

  // Need at least a couple of real anchors, or the "story" is too generic to
  // beat the static fallback.
  const anchorCount =
    facts.lifeEvents.length + facts.family.length + facts.favoritePlaces.length;
  if (anchorCount < 2) return null;

  const system = [
    "You write a short, warm, TRUE-TO-LIFE story to help an elderly dementia patient practise memory, then questions about it.",
    "Use the patient's real life events, family, places and hobbies as the story's content. Keep it gentle, positive and concrete - never anything sad, medical, political, or distressing.",
    `Write about ${sentenceTarget} short, simple sentences in warm plain language (second or third person).`,
    `Then write EXACTLY ${questionCount} questions. Every answer MUST be stated word-for-word in the story. Each question needs the correct answer plus 3 plausible but clearly wrong options.`,
    'Respond with JSON only: {"story": "<the story>", "questions": [{"question": "<q>", "correctAnswer": "<a>", "options": ["<a>", "<wrong1>", "<wrong2>", "<wrong3>"]}]}',
  ].join("\n");

  const user = `Patient facts:\n${JSON.stringify(facts, null, 2)}`;

  const response = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const parsed = extractResponseJson(response);
  const story = cleanText(parsed?.story, 900);
  if (!story || story.length < 40 || containsBlockedTerm(story)) return null;

  const shuffle = (arr) => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const questions = [];
  (Array.isArray(parsed?.questions) ? parsed.questions : []).forEach((q, i) => {
    const question = cleanText(q?.question, 160);
    const correctAnswer = cleanText(q?.correctAnswer, 60);
    const rawOptions = (Array.isArray(q?.options) ? q.options : [])
      .map((o) => cleanText(o, 60))
      .filter(Boolean);
    if (!question || !correctAnswer) return;
    if ([question, correctAnswer, ...rawOptions].some(containsBlockedTerm)) return;

    // Ensure the correct answer is present, and cap to 4 unique options.
    const seen = new Set();
    const options = [];
    [correctAnswer, ...rawOptions].forEach((opt) => {
      const key = opt.toLowerCase();
      if (!seen.has(key) && options.length < 4) {
        seen.add(key);
        options.push(opt);
      }
    });
    if (options.length < 2) return;

    questions.push({
      id: `sq${i}`,
      question,
      correctAnswer,
      options: shuffle(options),
    });
  });

  // Only trust the LLM round if it produced the full set; otherwise fall back.
  if (questions.length < questionCount) return null;

  return { story, questions: questions.slice(0, questionCount) };
}

module.exports = {
  generateLlmGameContent,
  generateStoryRecall,
  generateOrientationDistractors,
  generateFaceNameDecoys,
  generateImagePrompts,
};
