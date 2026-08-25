export type GameId =
  | "memory_recall"
  | "object_recall"
  | "attention_game"
  | "photo_puzzle"
  | "word_puzzle"
  | "orientation_game"
  | "face_name_match";

export type Difficulty = "easy" | "medium" | "hard";
export type GamePhase = "instruction" | "playing" | "result";

// Memory Recall config
export interface MemoryRecallConfig {
  sequenceLength: number; // 3 | 5 | 7
  displayTimeMs: number; // how long each item shows
  timeLimitSeconds: number;
  showHints: boolean;
  items: SequenceItem[];
}
export interface SequenceItem {
  id: string;
  emoji: string;
  label: string;
  category: string;
  /** Real personal photo (e.g. a family member's photo) — shown instead of the emoji when present. */
  image?: string;
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
  /** Real personal photo (e.g. a family member's photo) — shown instead of the emoji when present. */
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
export interface OrientationGameConfig {
  questionCount: number;
  optionsCount: number;
  timeLimitSeconds: number | null;
  questions: OrientationQuestion[];
}
export interface OrientationQuestion {
  id: string;
  question: string;
  icon: string;
  category: "Time" | "Place" | "Festival";
  correctAnswer: string;
  options: string[];
}

// ── Face-Name Match config
export interface FaceNameMatchConfig {
  questionCount: number;
  optionsCount: number;
  timeLimitSeconds: number | null;
  questions: FaceNameQuestion[];
}
export interface FaceNameQuestion {
  id: string;
  emoji: string;
  /** Real family photo — shown instead of the emoji when present. */
  image?: string;
  relationLabel: string;
  correctAnswer: string;
  options: string[];
}

// Union type — any game config
export type GameConfig =
  | MemoryRecallConfig
  | ObjectRecallConfig
  | AttentionGameConfig
  | PhotoPuzzleConfig
  | WordPuzzleConfig
  | OrientationGameConfig
  | FaceNameMatchConfig;

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

// Adaptive difficulty — server-computed, updated after every session
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
