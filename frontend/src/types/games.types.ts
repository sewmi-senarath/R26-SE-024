export type GameId =
  | "memory_recall"
  | "object_recall"
  | "attention_game"
  | "photo_puzzle"
  | "word_puzzle"
  | "orientation_game"
  | "face_name_match"
  | "grid_flash"
  | "listen_repeat"
  | "memory_match"
  | "story_recall";

export type Difficulty = "easy" | "medium" | "hard";
export type GamePhase = "instruction" | "playing" | "result";

// Memory Recall config
export interface MemoryRecallConfig {
  sequenceLength: number; // 3 | 5 | 7
  displayTimeMs: number; // how long each item shows
  timeLimitSeconds: number;
  showHints: boolean;
  items: SequenceItem[];
  /**
   * Decoy options shown in the recall grid alongside `items`. Drawn from the
   * same pool and de-duplicated against `items`, and carry generated images
   * just like the correct items so the answer isn't given away by styling.
   */
  distractors?: SequenceItem[];
}
export interface SequenceItem {
  id: string;
  emoji: string;
  label: string;
  category: string;
  /** Real personal photo (e.g. a family member's photo) - shown instead of the emoji when present. */
  image?: string;
}

// ── Grid Flash config (Registration / visuo-spatial working memory)
export interface GridFlashConfig {
  /** Grid is gridSize x gridSize cells. 3 | 4 | 5 */
  gridSize: number;
  /** How many cells light up in the sequence. 3 | 5 | 7 */
  sequenceLength: number;
  /** How long each cell stays lit - held constant across difficulties. */
  flashTimeMs: number;
  /** Show the item label under a flashed cell (easy support). */
  showLabels: boolean;
  /** Tokens shown on the flashed cells - one per sequence step, personalized. */
  items: SequenceItem[];
}

// ── Memory Match config (Recall / delayed visual pairing)
export interface MemoryMatchConfig {
  /** Number of distinct pairs. 3 | 6 | 8 (cards = pairCount * 2). */
  pairCount: number;
  /** Columns in the card grid - drives the layout. */
  columns: number;
  /** How long all cards are shown face-up before play begins. */
  peekMs: number;
  /** Optional cap on flip attempts (hard); null = unlimited. */
  moveLimit: number | null;
  /** One item per pair - each appears on exactly two cards. Personalized. */
  items: SequenceItem[];
}

// ── Story Recall config (Recall / delayed narrative memory)
export interface StoryQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  /** Multiple-choice options; when omitted the patient types the answer. */
  options?: string[];
}
export interface StoryRecallConfig {
  /** How many questions are asked. 2 | 4 | 6 */
  questionCount: number;
  /** "choice" = all multiple-choice; "mixed" = some typed (hard). */
  answerMode: "choice" | "mixed";
  /** A light distraction gap before the questions appear (ms). */
  delayMs: number;
  /** The narrative, ideally built from the patient's own life events. */
  story: string;
  questions: StoryQuestion[];
}

// ── Listen & Repeat config (Registration / auditory verbal span)
export interface ListenRepeatConfig {
  /** How many words are spoken. 3 | 5 | 7 */
  wordCount: number;
  /** Whether the patient may replay the spoken words (easy). */
  allowReplay: boolean;
  /** "choice" shows a selectable grid; "input" asks the patient to type. */
  answerMode: "choice" | "input";
  /** The spoken target words (label is read aloud and scored). */
  items: SequenceItem[];
  /** Decoy options for the choice grid, de-duplicated against items. */
  distractors?: SequenceItem[];
}

//  Object Recall config
export interface ObjectRecallConfig {
  objectCount: number; // 3 | 5 | 8
  displayTimeMs: number;
  timeLimitSeconds: number | null;
  showCategoryHints: boolean;
  objects: RecallObject[];
}
export interface RecallObject {
  id: string;
  emoji: string;
  label: string;
  category: string;
  /** Real personal photo (e.g. a family member's photo) - shown instead of the emoji when present. */
  image?: string;
}

// ── Attention Game config
export interface AttentionGameConfig {
  targetEmoji: string;
  distractorEmojis: string[];
  gridSize: number; // 3x3 | 4x4 | 5x5
  intervalMs: number; // how fast items shuffle
  timeLimitSeconds: number;
  targetCount: number; // how many targets are hidden in grid
}

// ── Family Photo Puzzle config
export interface PhotoPuzzleConfig {
  gridSize: number; // 2x2 | 3x3 | 4x4
  pieceCount: number; // 4 | 9 | 16
  showGhostGuide: boolean;
  allowRotation: boolean;
  timeLimitSeconds: number | null;
}

// ── Word Puzzle config
export interface WordPuzzleConfig {
  wordLength: number; // 3 | 5 | 8
  showLetterHints: boolean;
  timeLimitSeconds: number | null;
  scrambled: boolean;
  words: PuzzleWord[];
}
export interface PuzzleWord {
  id: string;
  word: string;
  hint: string;
  category: string;
  image?: string;
}

// ── Orientation Game config
export interface OrientationMemoryAnchor {
  /** The word the patient is asked to hold in mind (hard-level delayed recall). */
  word: string;
  icon: string;
  statement: string;
}
export interface OrientationGameConfig {
  questionCount: number;
  optionsCount: number;
  timeLimitSeconds: number | null;
  questions: OrientationQuestion[];
  /** Cognitive tiers this level draws from: 1=recognition, 2=orientation, 3=reasoning. */
  tiers?: number[];
  distractorSpread?: "near" | "far";
  /** Show a helper hint under the question (easy). */
  showHints?: boolean;
  /** Show the category label + icon (hidden on hard to remove cues). */
  showCategory?: boolean;
  /** Read each question aloud automatically (easy). */
  autoReadAloud?: boolean;
  /** "recall" replaces the option buttons with a typed answer for numeric questions. */
  answerMode?: "choice" | "recall";
  /** Whether a delayed-recall word is woven into this round (hard). */
  delayedRecall?: boolean;
  memoryAnchor?: OrientationMemoryAnchor;
}
export interface OrientationQuestion {
  id: string;
  question: string;
  icon: string;
  category: "Time" | "Place" | "Festival" | "Calendar" | "Memory";
  correctAnswer: string;
  options: string[];
  /** Cognitive demand tier: 1=recognition, 2=current-state orientation, 3=reasoning. */
  tier?: 1 | 2 | 3;
  /** Optional hint shown on easy difficulty. */
  hint?: string;
  /** True when the answer is a plain number - eligible for hard-level recall input. */
  numeric?: boolean;
  /** Inclusive range for the hard-level number wheel (recall input). */
  numericRange?: { min: number; max: number };
}

// ── Face-Name Match config
export interface FaceNameMatchConfig {
  questionCount: number;
  optionsCount: number;
  timeLimitSeconds: number | null;
  questions: FaceNameQuestion[];
  /** "choice" = pick from options; "recall" = free recall, reveal & self-check (hard). */
  answerMode?: "choice" | "recall";
  /** Show the Family Album to study before the questions begin (medium/hard). */
  studyPhase?: boolean;
  /** Errorless helper: reveal the first letter if the patient hesitates (easy). */
  firstLetterCue?: boolean;
  /** Wrong-answer names are always other real relatives; "sameGender" (medium/hard) prefers same-gender relatives for a more confusable choice, "mixed" (easy) uses any. */
  distractorStyle?: "mixed" | "sameGender";
}
export interface FaceNameQuestion {
  id: string;
  emoji: string;
  /** Real family photo - shown instead of the emoji when present. */
  image?: string;
  relationLabel: string;
  /** The relation word alone (e.g. "daughter") - used for album narration. */
  relation?: string;
  correctAnswer: string;
  options: string[];
}

// Union type - any game config
export type GameConfig =
  | MemoryRecallConfig
  | ObjectRecallConfig
  | AttentionGameConfig
  | PhotoPuzzleConfig
  | WordPuzzleConfig
  | OrientationGameConfig
  | FaceNameMatchConfig
  | GridFlashConfig
  | ListenRepeatConfig
  | MemoryMatchConfig
  | StoryRecallConfig;

// Result tracked after each game session
export interface GameSessionResult {
  gameId: GameId;
  patientId?: string;
  difficulty: Difficulty;
  score: number;
  maxScore: number;
  timeTakenSeconds: number;
  completedAt: string;
  correctAnswers: number;
  totalAnswers: number;
}

export type SectionName =
  | "Orientation"
  | "Registration"
  | "Attention"
  | "Recall"
  | "Language";

export interface GameDifficultyAssignment {
  gameId: GameId;
  difficulty: Difficulty;
  sectionName: SectionName | "Overall";
  sectionScore: number;
  sectionMax: number;
  scorePercent: number;
  reason: string;
}

export interface GamePlan {
  assignments: GameDifficultyAssignment[];
  generatedAt: string;
  basedOnSessionId: string;
}

// Adaptive difficulty - server-computed, updated after every session
export interface DifficultyProgressUpdate {
  gameId: GameId;
  previousDifficulty: Difficulty;
  difficulty: Difficulty;
  changed: boolean;
  reason: string | null;
  compositeScore: number;
  totalSessions: number;
  recentScores: number[];
}

export interface PatientGameProgress {
  gameId: GameId;
  difficulty: Difficulty;
  totalSessions: number;
  lastChangeAt: string | null;
  lastChangeReason: string | null;
  recentScores: number[];
}

// Rich per-game adaptive-difficulty report shown in the patient profile.
export interface DifficultyChangeEntry {
  from: Difficulty;
  to: Difficulty;
  direction: "up" | "down";
  reason: string;
  avgComposite: number;
  at: string | null;
}

export interface DifficultyGameReport {
  gameId: GameId;
  currentDifficulty: Difficulty;
  totalSessions: number;
  averageComposite: number | null;
  latestMetrics: {
    accuracy: number | null;
    correctnessRate: number | null;
    speedScore: number | null;
    composite: number | null;
  } | null;
  recentScores: number[];
  lastChangeAt: string | null;
  changeCount: number;
  changeHistory: DifficultyChangeEntry[];
}
