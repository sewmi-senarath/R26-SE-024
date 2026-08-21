import { GamePlan, GameDifficultyAssignment, Difficulty, SectionName } from '../types/games.types';
import { GAME_CONFIGS, GAME_ORDER } from '../constants/games';

// MMSESession is a simplified interface here — 
// import your full MMSESession from assessment.ts if you have it,
// or use this minimal version that matches what the games need
export interface SessionScores {
  sessionId: string;
  totalScore: number;
  sectionScores: {
    Orientation: number;
    Registration: number;
    Attention: number;
    Recall: number;
    Language: number;
  };
}

function computeDifficulty(
  scorePercent: number,
  hardThreshold: number,
  mediumThreshold: number
): Difficulty {
  if (scorePercent >= hardThreshold) return 'hard';
  if (scorePercent >= mediumThreshold) return 'medium';
  return 'easy';
}

function getSectionScore(session: SessionScores, section: string): number {
  if (section === 'Overall') return session.totalScore;
  return session.sectionScores[section as SectionName] ?? 0;
}

export function generateGamePlan(session: SessionScores): GamePlan {
  const assignments: GameDifficultyAssignment[] = GAME_ORDER.map(gameId => {
    const config = GAME_CONFIGS[gameId];
    const sectionScore = getSectionScore(session, config.targetSection);
    const scorePercent = Math.round((sectionScore / config.sectionMax) * 100);
    const difficulty = computeDifficulty(
      scorePercent,
      config.difficultyThresholds.hard,
      config.difficultyThresholds.medium,
    );

    const reason =
      difficulty === 'easy'
        ? `${config.targetSection} score was low (${sectionScore}/${config.sectionMax}) — starting with a gentler level`
        : difficulty === 'medium'
        ? `${config.targetSection} score was moderate (${sectionScore}/${config.sectionMax})`
        : `${config.targetSection} score was strong (${sectionScore}/${config.sectionMax})`;

    return {
      gameId,
      difficulty,
      sectionName: config.targetSection as SectionName,
      sectionScore,
      sectionMax: config.sectionMax,
      scorePercent,
      reason,
    };
  });

  return {
    assignments,
    generatedAt: new Date().toISOString(),
    basedOnSessionId: session.sessionId,
  };
}