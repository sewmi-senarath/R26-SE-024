import AsyncStorage from "@react-native-async-storage/async-storage";

// The Attention Game has no personal content to draw on, so "freshness" here
// means changing WHAT the patient hunts for each session — a star among circles
// one time, a rabbit among animals the next — while keeping the difficulty
// identical (same grid size, speed, target count, and number of distractor
// types). Each theme pairs one visually distinct target with a family of
// look-alike distractors so the discrimination task stays equally hard.
export interface AttentionTheme {
  id: string;
  target: string;
  distractors: string[]; // at least 6, so the hard level (6 distractors) is covered
}

export const ATTENTION_THEMES: AttentionTheme[] = [
  { id: "circles", target: "⭐", distractors: ["🔵", "🟡", "🟢", "🔴", "🟣", "🟠"] },
  { id: "squares", target: "⭐", distractors: ["🟦", "🟨", "🟩", "🟥", "🟪", "🟧"] },
  { id: "fruits", target: "🍎", distractors: ["🍊", "🍋", "🍌", "🍐", "🥭", "🍑"] },
  { id: "animals", target: "🐰", distractors: ["🐶", "🐱", "🐭", "🐹", "🦊", "🐻"] },
  { id: "flowers", target: "🌻", distractors: ["🌸", "🌺", "🌷", "🌹", "🌼", "💐"] },
  { id: "vehicles", target: "🚗", distractors: ["🚕", "🚙", "🚌", "🚐", "🚓", "🚑"] },
  { id: "hearts", target: "❤️", distractors: ["💙", "💚", "💛", "💜", "🧡", "🖤"] },
];

const RECENT_KEY = "attention.recentThemes";
const AVOID_LAST = Math.min(3, ATTENTION_THEMES.length - 1);

// Pick a theme the patient has not seen in the last few sessions, then remember
// it. `distractorCount` keeps the difficulty intact by trimming the distractor
// family to the number this level uses. Storage failures degrade to a random
// pick, so the game never breaks over rotation bookkeeping.
export async function pickAttentionTheme(
  distractorCount: number,
): Promise<{ id: string; targetEmoji: string; distractorEmojis: string[] }> {
  let recent: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (raw) recent = JSON.parse(raw);
  } catch {
    recent = [];
  }

  const avoid = new Set(recent.slice(-AVOID_LAST));
  const candidates = ATTENTION_THEMES.filter((t) => !avoid.has(t.id));
  const pool = candidates.length ? candidates : ATTENTION_THEMES;
  const theme = pool[Math.floor(Math.random() * pool.length)];

  try {
    const next = [...recent, theme.id].slice(-AVOID_LAST);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore — a missed write just means a slightly higher repeat chance
  }

  return {
    id: theme.id,
    targetEmoji: theme.target,
    distractorEmojis: theme.distractors.slice(0, Math.max(1, distractorCount)),
  };
}
