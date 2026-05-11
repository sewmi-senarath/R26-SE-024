const mongoose = require("mongoose");
const Patient = require("../../../models/caregiver/Patient");
const User = require("../../../models/auth/User");
const { getStaticGameContent } = require("./staticGameContent");

const VALID_GAMES = new Set(["memory_recall", "object_recall", "word_puzzle"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

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
    .map((member, index) => ({
      id: `pf${index + 1}`,
      emoji: emojiForRelation(member.relation),
      label: member.name.trim(),
      category: "Family",
    }));

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

  return [...occupationItems, ...festivalItems, ...foodItems].map((item, index) => ({
    id: `po${index + 1}`,
    ...item,
  }));
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
    "familyMembers.name familyMembers.relation lifeEvents countriesLived occupations " +
      "favoritePlaces favoritePlacesText festivalsCelebrated foodsPreferred preferredSports " +
      "preferredSportsText languagesPreferred hometown"
  );
  if (!hasProfileData(patient)) {
    return { config: staticConfig, personalized: false };
  }

  if (gameId === "memory_recall") {
    const requiredCount = staticConfig.sequenceLength;
    const { items, personalized } = takeWithFallback(
      buildMemoryItems(patient),
      staticConfig.items,
      requiredCount
    );
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

  return {
    config: { ...staticConfig, words: items },
    personalized,
  };
}

module.exports = {
  getPersonalizedGameContent,
};

