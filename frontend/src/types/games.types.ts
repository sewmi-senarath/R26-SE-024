export type GameId =
  | "memory_recall"
  | "object_recall"
  | "attention_game"
  | "photo_puzzle"
  | "word_puzzle";

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

// Union type — any game config
export type GameConfig =
  | MemoryRecallConfig
  | ObjectRecallConfig
  | AttentionGameConfig
  | PhotoPuzzleConfig
  | WordPuzzleConfig;

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
