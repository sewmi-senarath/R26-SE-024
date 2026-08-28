import { Ionicons } from "@expo/vector-icons";
import { OrientationQuestion } from "@/src/types/games.types";

type IoniconName = keyof typeof Ionicons.glyphMap;

// Review panels discourage emoji in the UI, so the Orientation quiz shows crisp
// Ionicons instead. The content pipeline still tags each question with a topic
// emoji; we translate that emoji (and, as a fallback, the question category)
// into a concrete vector icon. Nothing here reveals the answer - the icon only
// names the topic (a calendar for date questions, a fast-forward for "what comes
// after"), never a specific value.
const EMOJI_ICON_MAP: Record<string, IoniconName> = {
  "\u{1F4C5}": "calendar-number-outline", // year / date / months-in-year
  "\u{1F4C6}": "today-outline", // weekday / weekend / days-in-month
  "\u{1F5D3}": "calendar-clear-outline", // month / next month / days-in-week
  "\u{23F0}": "alarm-outline", // time of day / hours-in-day
  "\u{1F55B}": "time-outline", // AM / PM
  "\u{27A1}": "arrow-forward-outline", // tomorrow
  "\u{2B05}": "arrow-back-outline", // yesterday
  "\u{23E9}": "play-forward-outline", // day after tomorrow (fast-forward)
  "\u{23EA}": "play-back-outline", // two months ago (rewind)
  "\u{1F305}": "partly-sunny-outline", // morning vs evening
  "\u{1F9E0}": "bulb-outline", // delayed-recall memory word
  "\u{1F389}": "sparkles-outline", // festival (fireworks)
  "\u{1F386}": "sparkles-outline", // fireworks
  "\u{1F3E0}": "home-outline", // place / home
  "\u{1F4CD}": "location-outline", // place
};

const CATEGORY_ICON_MAP: Record<string, IoniconName> = {
  Time: "time-outline",
  Place: "home-outline",
  Festival: "sparkles-outline",
  Calendar: "calendar-outline",
  Memory: "bulb-outline",
};

// Icon tint per category, matching the pastel circle behind it.
export const CATEGORY_ICON_COLOR: Record<string, string> = {
  Time: "#0284C7",
  Place: "#16A34A",
  Festival: "#D97706",
  Calendar: "#4F46E5",
  Memory: "#7C3AED",
};

// Several of these emojis carry a trailing variation selector (U+FE0E/U+FE0F)
// or joiner (U+200D) in the content data (e.g. the spiral-calendar and arrow
// glyphs). Drop those code points so the bare-codepoint map keys still match.
const SELECTOR_CODEPOINTS = new Set([0xfe0e, 0xfe0f, 0x200d]);

function stripVariationSelectors(value: string): string {
  return Array.from(value)
    .filter((ch) => !SELECTOR_CODEPOINTS.has(ch.codePointAt(0) ?? 0))
    .join("")
    .trim();
}

export function getOrientationIcon(
  question?: Pick<OrientationQuestion, "icon" | "category"> | null,
): IoniconName {
  if (!question) return "help-circle-outline";
  const key = stripVariationSelectors(question.icon ?? "");
  return (
    EMOJI_ICON_MAP[key] ??
    CATEGORY_ICON_MAP[question.category] ??
    "help-circle-outline"
  );
}
