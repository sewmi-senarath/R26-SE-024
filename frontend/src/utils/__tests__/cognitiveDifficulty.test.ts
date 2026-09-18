import { generateGamePlan } from '../difficultyEngine';
import type { SessionScores } from '../difficultyEngine';

describe('patient cognitive game-plan difficulty', () => {
  it('assigns easy, medium, and hard games from the assessed section scores', () => {
    const session: SessionScores = {
      sessionId: 'assessment-1',
      totalScore: 19,
      sectionScores: {
        Orientation: 9,
        Registration: 2,
        Attention: 1,
        Recall: 0,
        Language: 5,
      },
    };

    const plan = generateGamePlan(session);
    const difficultyOf = (gameId: string) =>
      plan.assignments.find((item) => item.gameId === gameId)?.difficulty;

    expect(plan.basedOnSessionId).toBe('assessment-1');
    expect(difficultyOf('orientation_game')).toBe('hard');
    expect(difficultyOf('word_puzzle')).toBe('medium');
    expect(difficultyOf('attention_game')).toBe('easy');
  });
});
