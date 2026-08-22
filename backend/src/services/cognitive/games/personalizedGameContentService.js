const mongoose = require("mongoose");
const Patient = require("../../../models/caregiver/Patient");
const User = require("../../../models/auth/User");
const { getStaticGameContent, buildFaceQuestions, FALLBACK_FACES } = require("./staticGameContent");
const { buildTimeOrientationQuestions } = require("./orientationFacts");
const { shuffle, pickDistractors } = require("./gameContentUtils");
const {
  generateLlmGameContent,
  generateOrientationDistractors,
  generateFaceNameDecoys,
} = require("./llmGameContentService");

const VALID_GAMES = new Set([
  "memory_recall",
  "object_recall",
  "word_puzzle",
  "orientation_game",
  "face_name_match",
]);
// Games whose entire content the LLM is trusted to generate directly.
const LLM_FULL_CONTENT_GAMES = new Set(["memory_recall", "object_recall", "word_puzzle"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const FESTIVAL_DISPLAY_NAMES = {
  vesak: "Vesak",
  christmas: "Christmas",
  eid: "Eid",
  deepavali: "Deepavali",
};
const EXTRA_FESTIVALS = ["Easter", "Thanksgiving", "Halloween", "New Year's Day"];
const FALLBACK_CITIES = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Negombo",
  "Kurunegala", "Anuradhapura", "Matara", "Trincomalee", "Batticaloa",
];
const FILLER_NAMES = ["Alex", "Maria", "Sam", "Grace", "John", "Emma", "Leo", "Nina", "Ray", "Zoe"];

const FAMILY_EMOJIS = {
  daughter: "\u{1F469}",
  son: "\u{1F468}",
  wife: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}",
  husband: "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F469}",
  mother: "\u{1F469}",
  father: "\u{1F468}",
  parent: "\u{1F46A}",
  sister: "\u{1F469}",
  brother: "\u{1F468}",
  grandchild: "\u{1F9D2}",
  grandson: "\u{1F466}",
  granddaughter: "\u{1F467}",
};

const FOOD_EMOJIS = {
  rice: "\u{1F35A}",
  curry: "\u{1F35B}",
  bread: "\u{1F35E}",
  cake: "\u{1F370}",
  tea: "\u{1F375}",
  coffee: "\u2615",
  apple: "\u{1F34E}",
  banana: "\u{1F34C}",
  mango: "\u{1F96D}",
  fish: "\u{1F41F}",
  chicken: "\u{1F357}",
  soup: "\u{1F372}",
  pizza: "\u{1F355}",
};

const PLACE_EMOJIS = {
  home: "\u{1F3E0}",
  temple: "\u{1F6D5}",
  church: "\u26EA",
  mosque: "\u{1F54C}",
  beach: "\u{1F3D6}\uFE0F",
  park: "\u{1F333}",
  garden: "\u{1F33F}",
  school: "\u{1F3EB}",
  hospital: "\u{1F3E5}",
};

const OCCUPATION_OBJECTS = {
  teacher: [
    { label: "Textbook", emoji: "\u{1F4D8}", category: "Teaching" },
    { label: "Chalk", emoji: "\u270F\uFE0F", category: "Teaching" },
  ],
  farmer: [
    { label: "Paddy", emoji: "\u{1F33E}", category: "Farming" },
    { label: "Hoe", emoji: "\u{1F6E0}\uFE0F", category: "Farming" },
  ],
  cook: [
    { label: "Pot", emoji: "\u{1F372}", category: "Cooking" },
    { label: "Spoon", emoji: "\u{1F944}", category: "Cooking" },
  ],
  chef: [
    { label: "Pot", emoji: "\u{1F372}", category: "Cooking" },
    { label: "Spoon", emoji: "\u{1F944}", category: "Cooking" },
  ],
  doctor: [
    { label: "Stethoscope", emoji: "\u{1FA7A}", category: "Medical" },
    { label: "Medicine", emoji: "\u{1F48A}", category: "Medical" },
  ],
  nurse: [
    { label: "Bandage", emoji: "\u{1FA79}", category: "Medical" },
    { label: "Medicine", emoji: "\u{1F48A}", category: "Medical" },
  ],
  driver: [
    { label: "Wheel", emoji: "\u{1F6DE}", category: "Transport" },
    { label: "Keys", emoji: "\u{1F511}", category: "Transport" },
  ],
  carpenter: [
    { label: "Hammer", emoji: "\u{1F528}", category: "Tools" },
    { label: "Wood", emoji: "\u{1FAB5}", category: "Tools" },
  ],
  tailor: [
    { label: "Needle", emoji: "\u{1FAA1}", category: "Sewing" },
    { label: "Thread", emoji: "\u{1F9F5}", category: "Sewing" },
  ],
};

const FESTIVAL_OBJECTS = {
  vesak: [
    { label: "Lantern", emoji: "\u{1F3EE}", category: "Festival" },
    { label: "Lamp", emoji: "\u{1FA94}", category: "Festival" },
  ],
  christmas: [
    { label: "Star", emoji: "\u2B50", category: "Festival" },
    { label: "Candle", emoji: "\u{1F56F}\uFE0F", category: "Festival" },
  ],
  eid: [
    { label: "Moon", emoji: "\u{1F319}", category: "Festival" },
    { label: "Dates", emoji: "\u{1FAD2}", category: "Festival" },
  ],
  deepavali: [
    { label: "Lamp", emoji: "\u{1FA94}", category: "Festival" },
    { label: "Sweets", emoji: "\u{1F36C}", category: "Festival" },
  ],
};

const FOOD_OBJECTS = {
  rice: { label: "Rice", emoji: "\u{1F35A}", category: "Ingredient" },
  curry: { label: "Pot", emoji: "\u{1F372}", category: "Kitchen" },
  tea: { label: "Cup", emoji: "\u2615", category: "Kitchen" },
  coffee: { label: "Cup", emoji: "\u2615", category: "Kitchen" },
  bread: { label: "Bread", emoji: "\u{1F35E}", category: "Food" },
  cake: { label: "Cake", emoji: "\u{1F370}", category: "Food" },
  fish: { label: "Fish", emoji: "\u{1F41F}", category: "Food" },
  soup: { label: "Bowl", emoji: "\u{1F963}", category: "Kitchen" },
};

const COMMON_WORDS = new Set([
  "ace", "art", "bag", "bat", "bed", "box", "bus", "cap", "cat", "cup",
  "dog", "egg", "fan", "fox", "hat", "hen", "jam", "key", "map", "pen",
  "pot", "red", "run", "sea", "son", "sun", "tea", "toy", "van", "war",
  "apple", "beach", "bread", "chair", "clock", "dance", "fruit", "grace",
  "green", "happy", "house", "india", "light", "mango", "music", "plant",
  "river", "sugar", "table", "tiger", "water", "world",
  "calendar", "children", "elephant", "festival", "hospital", "language",
  "medicine", "mountain", "umbrella",
]);

// One line per served request so it's obvious in the backend console which
// content tier actually answered: "llm (groq)" means Groq generated it,
// "rule-based" means it was built from the patient's profile, and "static"
// means neither fired and the hardcoded fallback was used.
function logTier(tier, { gameId, difficulty, patientId, personalized }) {
  console.log(
    `[game-content] served: ${tier} | game=${gameId} difficulty=${difficulty} ` +
      `patient=${patientId} personalized=${personalized}`
  );
}

function assertValidRequest(gameId, difficulty) {
  if (!VALID_GAMES.has(gameId)) {
    const error = new Error("Personalized content is only available for memory_recall, object_recall, and word_puzzle.");
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_DIFFICULTIES.has(difficulty)) {
    const error = new Error("Invalid difficulty.");
    error.statusCode = 400;
    throw error;
  }
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

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhotoValue(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("blob:")) return null;
  return trimmed;
}

function buildFamilyPhotoMap(patient) {
  const map = new Map();
  (patient.familyMembers || []).forEach((member) => {
    const name = member?.name?.trim();
    const photo = normalizePhotoValue(member?.photo);
    if (!photo) return;

    if (name) map.set(normalizeKey(name), photo);

    // The LLM sometimes echoes the relation ("Mom") instead of the literal
    // name — index that too so the real photo still gets matched.
    const relation = member?.relation?.trim();
    if (relation && !map.has(normalizeKey(relation))) {
      map.set(normalizeKey(relation), photo);
    }
  });
  return map;
}

function attachFamilyPhotos(items, photoMap) {
  if (!photoMap || !photoMap.size || !Array.isArray(items)) return items;
  return items.map((item) => {
    const photo = photoMap.get(normalizeKey(item.label));
    return photo ? { ...item, image: photo } : item;
  });
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasProfileData(patient) {
  if (!patient) return false;
  return Boolean(
    patient.familyMembers?.length ||
      patient.lifeEvents?.length ||
      patient.countriesLived?.length ||
      patient.occupations?.length ||
      patient.favoritePhotos?.length ||
      patient.favoritePlaces?.length ||
      patient.favoritePlacesText ||
      patient.festivalsCelebrated?.length ||
      patient.foodsPreferred?.length ||
      patient.hobbies?.length ||
      patient.interests?.length ||
      patient.preferredSports?.length ||
      patient.preferredSportsText ||
      patient.languagesPreferred?.length ||
      patient.hometown
  );
}

function uniqueByLabel(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeKey(item.label || item.word);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function takeWithFallback(personalItems, fallbackItems, requiredCount) {
  const selected = uniqueByLabel(personalItems).slice(0, requiredCount);
  const selectedKeys = new Set(selected.map((item) => normalizeKey(item.label || item.word)));
  const fallback = fallbackItems.filter((item) => !selectedKeys.has(normalizeKey(item.label || item.word)));

  return {
    items: [...selected, ...fallback].slice(0, requiredCount),
    personalized: selected.length > 0,
  };
}

function emojiForRelation(relation) {
  const key = normalizeKey(relation);
  return FAMILY_EMOJIS[key] || "\u{1F46A}";
}

function emojiForFood(food) {
  const key = normalizeKey(food);
  return FOOD_EMOJIS[key] || "\u{1F37D}\uFE0F";
}

function emojiForPlace(place) {
  const key = normalizeKey(place);
  return PLACE_EMOJIS[key] || "\u{1F4CD}";
}

function buildMemoryItems(patient) {
  const familyItems = (patient.familyMembers || [])
    .filter((member) => member?.name)
    .map((member, index) => {
      const photo = normalizePhotoValue(member.photo);
      return {
        id: `pf${index + 1}`,
        emoji: emojiForRelation(member.relation),
        label: member.name.trim(),
        category: "Family",
        ...(photo ? { image: photo } : {}),
      };
    });

  const foodItems = (patient.foodsPreferred || [])
    .filter((food) => food?.name)
    .map((food, index) => ({
      id: `pfd${index + 1}`,
      emoji: emojiForFood(food.name),
      label: titleCase(food.name),
      category: "Food",
    }));

  const places = [
    ...compactStrings(patient.favoritePlaces),
    ...splitFreeText(patient.favoritePlacesText),
    ...compactStrings([patient.hometown]),
  ];
  const placeItems = places.map((place, index) => ({
    id: `pp${index + 1}`,
    emoji: emojiForPlace(place),
    label: titleCase(place),
    category: "Place",
  }));

  return [...familyItems, ...foodItems, ...placeItems];
}

function buildFamilyObjectItems(patient) {
  return (patient.familyMembers || [])
    .filter((member) => member?.name && normalizePhotoValue(member.photo))
    .map((member, index) => ({
      id: `pfo${index + 1}`,
      emoji: emojiForRelation(member.relation),
      label: member.name.trim(),
      category: "Family",
      image: normalizePhotoValue(member.photo),
    }));
}

function buildObjectItems(patient) {
  const occupationItems = compactStrings(patient.occupations).flatMap((occupation) => {
    const occupationKey = Object.keys(OCCUPATION_OBJECTS).find((key) =>
      normalizeKey(occupation).includes(key)
    );
    return occupationKey ? OCCUPATION_OBJECTS[occupationKey] : [];
  });

  const festivalItems = compactStrings(patient.festivalsCelebrated).flatMap((festival) => {
    const festivalKey = Object.keys(FESTIVAL_OBJECTS).find((key) =>
      normalizeKey(festival).includes(key)
    );
    return festivalKey ? FESTIVAL_OBJECTS[festivalKey] : [];
  });

  const foodItems = (patient.foodsPreferred || [])
    .map((food) => FOOD_OBJECTS[normalizeKey(food?.name)])
    .filter(Boolean);

  const genericItems = [...occupationItems, ...festivalItems, ...foodItems].map((item, index) => ({
    id: `po${index + 1}`,
    ...item,
  }));

  // Family members with a real photo take priority — recalling a loved one's
  // face and name is more meaningful than a generic occupation/food object.
  return [...buildFamilyObjectItems(patient), ...genericItems];
}

function cleanWord(value) {
  return String(value || "").replace(/[^a-z]/gi, "").toLowerCase();
}

function buildWordCandidates(patient, requiredLength) {
  const candidates = [];

  (patient.familyMembers || []).forEach((member) => {
    candidates.push({
      value: member?.name,
      hint: `Your ${member?.relation || "family member"}'s name`,
      category: "Family",
    });
  });

  compactStrings(patient.favoritePlaces).forEach((place) => {
    candidates.push({ value: place, hint: "A place you love", category: "Place" });
  });

  splitFreeText(patient.favoritePlacesText).forEach((place) => {
    candidates.push({ value: place, hint: "A place you love", category: "Place" });
  });

  (patient.foodsPreferred || []).forEach((food) => {
    candidates.push({ value: food?.name, hint: "A food you enjoy", category: "Food" });
  });

  compactStrings(patient.preferredSports).forEach((sport) => {
    candidates.push({ value: sport, hint: "A sport you enjoy", category: "Sport" });
  });

  splitFreeText(patient.preferredSportsText).forEach((sport) => {
    candidates.push({ value: sport, hint: "A sport you enjoy", category: "Sport" });
  });

  compactStrings(patient.festivalsCelebrated).forEach((festival) => {
    candidates.push({ value: festival, hint: "A festival you celebrate", category: "Festival" });
  });

  return uniqueByLabel(
    candidates
      .map((candidate, index) => {
        const word = cleanWord(candidate.value);
        if (word.length !== requiredLength || !COMMON_WORDS.has(word)) return null;
        return {
          id: `pw${index + 1}`,
          word: word.toUpperCase(),
          hint: candidate.hint,
          category: candidate.category,
        };
      })
      .filter(Boolean)
  );
}

function buildFestivalQuestion(patient, optionsCount, extraDistractors = []) {
  const celebrated = compactStrings(patient.festivalsCelebrated);
  if (!celebrated.length) return null;

  const correctAnswer = titleCase(celebrated[Math.floor(Math.random() * celebrated.length)]);
  const distractorPool = [
    ...Object.values(FESTIVAL_DISPLAY_NAMES),
    ...EXTRA_FESTIVALS,
    ...extraDistractors,
  ].filter((name) => !celebrated.some((c) => normalizeKey(c) === normalizeKey(name)));

  return {
    id: "of-festival",
    question: "Which festival does your family celebrate?",
    icon: "\u{1F389}",
    category: "Festival",
    correctAnswer,
    options: shuffle([
      correctAnswer,
      ...pickDistractors(distractorPool, [correctAnswer], optionsCount - 1),
    ]),
  };
}

function buildPlaceQuestion(patient, optionsCount, extraDistractors = []) {
  // Only a real hometown answers "which town do you call home". A favorite
  // place (e.g. "Village") is not necessarily where the patient is from, so we
  // no longer fall back to it — the question is simply skipped without one.
  const home = (patient.hometown || "").trim();
  if (!home) return null;

  const correctAnswer = titleCase(home);
  const distractorPool = [...FALLBACK_CITIES, ...extraDistractors].filter(
    (city) => normalizeKey(city) !== normalizeKey(correctAnswer)
  );

  return {
    id: "of-place",
    question: "Which city or town do you call home?",
    icon: "\u{1F3E0}",
    category: "Place",
    correctAnswer,
    options: shuffle([
      correctAnswer,
      ...pickDistractors(distractorPool, [correctAnswer], optionsCount - 1),
    ]),
  };
}

function buildOrientationItems(patient, optionsCount, llmDistractors) {
  const personalizedQuestions = [
    buildFestivalQuestion(patient, optionsCount, llmDistractors?.festivalDistractors),
    buildPlaceQuestion(patient, optionsCount, llmDistractors?.cityDistractors),
  ].filter(Boolean);

  const timeQuestions = buildTimeOrientationQuestions(optionsCount);

  return {
    all: [...personalizedQuestions, ...timeQuestions],
    personalizedCount: personalizedQuestions.length,
  };
}

function buildFaceNameItems(patient, optionsCount, llmDecoyNames) {
  const realPeople = shuffle(
    (patient.familyMembers || [])
      .filter((member) => member?.name)
      .map((member) => ({
        name: member.name.trim(),
        relationLabel: member.relation ? `Who is your ${member.relation}?` : "Who is this?",
        emoji: emojiForRelation(member.relation),
        image: normalizePhotoValue(member.photo) || undefined,
      }))
  );

  if (!realPeople.length) return [];

  const realNames = realPeople.map((p) => p.name);
  const fillerPool = [...FILLER_NAMES, ...(llmDecoyNames || [])].filter(
    (name) => !realNames.some((real) => normalizeKey(real) === normalizeKey(name))
  );
  const distractorPool = [...realNames, ...fillerPool];

  return realPeople.map((person, index) => ({
    id: `pface${index + 1}`,
    emoji: person.emoji,
    ...(person.image ? { image: person.image } : {}),
    relationLabel: person.relationLabel,
    correctAnswer: person.name,
    options: shuffle([
      person.name,
      ...pickDistractors(distractorPool, [person.name], optionsCount - 1),
    ]),
  }));
}

async function isAuthorizedForPatient(requestUser, patientId) {
  if (requestUser.role === "patient") {
    return requestUser.userId.toString() === patientId;
  }

  if (requestUser.role !== "caregiver") return false;

  const patient = await User.findOne({
    _id: patientId,
    role: "patient",
    assignedCaregiverId: requestUser.userId,
  }).select("_id");

  if (patient) return true;

  const caregiverPatient = await Patient.findOne({
    registeredPatientId: patientId,
    caregiverId: requestUser.userId,
  }).select("_id");

  return Boolean(caregiverPatient);
}

async function getPersonalizedGameContent({ gameId, patientId, difficulty, requestUser }) {
  assertValidRequest(gameId, difficulty);

  const staticConfig = getStaticGameContent(gameId, difficulty);
  if (!staticConfig) {
    const error = new Error("Game content not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    const error = new Error("Invalid patient id.");
    error.statusCode = 400;
    throw error;
  }

  const authorized = await isAuthorizedForPatient(requestUser, patientId);
  if (!authorized) {
    const error = new Error("You are not allowed to access this patient's game content.");
    error.statusCode = 403;
    throw error;
  }

  const patient = await User.findOne({ _id: patientId, role: "patient" }).select(
    "age preferredLanguage cognitiveLevel hometown hobbies interests " +
      "familyMembers.name familyMembers.relation familyMembers.photo lifeEvents countriesLived occupations " +
      "favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports " +
      "preferredSportsText languagesPreferred"
  );
  if (!hasProfileData(patient)) {
    logTier("static (no profile data)", { gameId, difficulty, patientId, personalized: false });
    return { config: staticConfig, personalized: false };
  }

  const familyPhotoMap = buildFamilyPhotoMap(patient);

  if (gameId === "orientation_game") {
    // The correct answer for every question here is either a real fact from
    // the patient's profile or the actual current date/time — never
    // LLM-generated — so a hallucination can never surface as "correct".
    // The LLM is only ever asked for plausible extra wrong-answer options.
    let llmDistractors = null;
    try {
      llmDistractors = await generateOrientationDistractors({ patient });
    } catch (error) {
      console.warn("[game-content] Orientation distractor generation failed:", error.message);
    }

    const requiredCount = staticConfig.questionCount;
    const { all, personalizedCount } = buildOrientationItems(
      patient,
      staticConfig.optionsCount,
      llmDistractors
    );

    logTier(
      llmDistractors ? "rule-based + groq distractors (orientation)" : "rule-based (orientation)",
      { gameId, difficulty, patientId, personalized: personalizedCount > 0 }
    );
    return {
      config: { ...staticConfig, questions: all.slice(0, requiredCount) },
      personalized: personalizedCount > 0,
    };
  }

  if (gameId === "face_name_match") {
    // The correct name for a photo always comes from the patient's own
    // family records — the LLM only ever supplies extra decoy first names.
    const realNames = compactStrings((patient.familyMembers || []).map((m) => m?.name));
    let llmDecoyNames = null;
    try {
      llmDecoyNames = await generateFaceNameDecoys({ patient, realNames });
    } catch (error) {
      console.warn("[game-content] Face-name decoy generation failed:", error.message);
    }

    const requiredCount = staticConfig.questionCount;
    const personalItems = buildFaceNameItems(patient, staticConfig.optionsCount, llmDecoyNames);
    const remaining = requiredCount - personalItems.length;
    const genericPeople = FALLBACK_FACES.filter(
      (face) => !realNames.some((name) => normalizeKey(name) === normalizeKey(face.name))
    );
    const fallbackItems =
      remaining > 0 ? buildFaceQuestions(genericPeople, remaining, staticConfig.optionsCount) : [];

    logTier(
      llmDecoyNames ? "rule-based + groq decoys (face-name)" : "rule-based (face-name)",
      { gameId, difficulty, patientId, personalized: personalItems.length > 0 }
    );
    return {
      config: { ...staticConfig, questions: [...personalItems, ...fallbackItems].slice(0, requiredCount) },
      personalized: personalItems.length > 0,
    };
  }

  try {
    const llmContent = await generateLlmGameContent({
      gameId,
      difficulty,
      patient,
      staticConfig,
    });

    if (llmContent) {
      // Overlay real family photos onto any matching item the LLM generated,
      // so a relative's actual photo replaces the generic emoji when possible.
      const personalizedContent = { ...llmContent };
      if (personalizedContent.items) {
        personalizedContent.items = attachFamilyPhotos(personalizedContent.items, familyPhotoMap);
      }
      if (personalizedContent.objects) {
        personalizedContent.objects = attachFamilyPhotos(personalizedContent.objects, familyPhotoMap);
      }

      logTier("llm (groq)", { gameId, difficulty, patientId, personalized: true });
      return {
        config: { ...staticConfig, ...personalizedContent },
        personalized: true,
      };
    }

    // Reached only when Groq returned but nothing survived validation
    // (bad JSON, blocked terms, too-short words, etc.).
    console.log(
      `[game-content] groq returned no usable content for game=${gameId}, falling back to rule-based`
    );
  } catch (error) {
    console.warn(
      "[game-content] LLM generation failed, falling back to rule-based content:",
      error.message
    );
  }

  if (gameId === "memory_recall") {
    const requiredCount = staticConfig.sequenceLength;
    const { items, personalized } = takeWithFallback(
      buildMemoryItems(patient),
      staticConfig.items,
      requiredCount
    );
    logTier(personalized ? "rule-based (groq fallback)" : "static (groq fallback)", {
      gameId, difficulty, patientId, personalized,
    });
    return {
      config: { ...staticConfig, items },
      personalized,
    };
  }

  if (gameId === "object_recall") {
    const requiredCount = staticConfig.objectCount;
    const { items, personalized } = takeWithFallback(
      buildObjectItems(patient),
      staticConfig.objects,
      requiredCount
    );
    logTier(personalized ? "rule-based (groq fallback)" : "static (groq fallback)", {
      gameId, difficulty, patientId, personalized,
    });
    return {
      config: { ...staticConfig, objects: items },
      personalized,
    };
  }

  const requiredCount = staticConfig.words.length;
  const { items, personalized } = takeWithFallback(
    buildWordCandidates(patient, staticConfig.wordLength),
    staticConfig.words,
    requiredCount
  );

  logTier(personalized ? "rule-based (groq fallback)" : "static (groq fallback)", {
    gameId, difficulty, patientId, personalized,
  });
  return {
    config: { ...staticConfig, words: items },
    personalized,
  };
}

module.exports = {
  getPersonalizedGameContent,
};

