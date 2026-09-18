import {
  computeSectionScores,
  computeSeverity,
  computeTotalScore,
  scoreAnswer,
} from '../scoring';
import type { MMSESession, Question } from '../../types/assessment.types';

const session = {
  registrationWords: ['apple', 'table', 'penny'],
} as MMSESession;

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    section: 'Orientation',
    type: 'mcq',
    prompt: 'What day is today?',
    expectedAnswers: ['Saturday'],
    maxScore: 1,
    ...overrides,
  };
}

describe('patient cognitive scoring', () => {
  it('awards the full score for the expected MCQ answer', () => {
    const item = question();

    expect(scoreAnswer(item.id, 'Saturday', session, item)).toBe(1);
    expect(scoreAnswer(item.id, 'Sunday', session, item)).toBe(0);
  });

  it('normalises case and surrounding whitespace for text answers', () => {
    const item = question({
      type: 'text_input',
      expectedAnswers: ['Colombo'],
    });

    expect(scoreAnswer(item.id, '  COLOMBO  ', session, item)).toBe(1);
  });

  it('adds question scores to their correct cognitive sections', () => {
    const questions = [
      question({ id: 'orientation', section: 'Orientation' }),
      question({
        id: 'recall',
        section: 'Recall',
        type: 'word_recall_input',
        words: ['apple', 'table', 'penny'],
        maxScore: 3,
      }),
    ];

    const sectionScores = computeSectionScores(
      { orientation: 'Saturday', recall: ['apple', 'penny'] },
      session,
      questions,
    );

    expect(sectionScores.Orientation).toBe(1);
    expect(sectionScores.Recall).toBe(2);
    expect(computeTotalScore(sectionScores)).toBe(3);
  });

  it('applies the agreed MMSE severity boundaries', () => {
    expect(computeSeverity(24)).toBe('none');
    expect(computeSeverity(19)).toBe('mild');
    expect(computeSeverity(18)).toBe('moderate');
    expect(computeSeverity(10)).toBe('moderate');
    expect(computeSeverity(9)).toBe('severe');
  });
});
