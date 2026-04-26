// scoring logic, impairment flag
// src/utils/scoring.ts
import {
  MMSE_QUESTIONS
} from "@/src/constants/questions";
import {
  MMSESession,
  ScoringLogEntry,
  SectionScores,
  Severity,
} from "@/src/types/assessment.types";

export function scoreAnswer(
  questionId: string,
  answer: any,
  session: MMSESession,
): number {
  const question = MMSE_QUESTIONS.find((q) => q.id === questionId);
  if (!question) return 0;

  switch (question.type) {
    case "mcq": {
      const selected = answer as string;
      return question.expectedAnswers?.includes(selected)
        ? question.maxScore
        : 0;
    }

    case "text_input": {
      const text = (answer as string).trim().toLowerCase();
      const expected =
        question.expectedAnswers?.map((e) => e.toLowerCase()) ?? [];
      return expected.includes(text) ? question.maxScore : 0;
    }

    case "word_recall_display":
    case "word_recall_input": {
      // answer is string[] of words the patient recalled
      const recalled = (answer as string[]).map((w) => w.trim().toLowerCase());
      const target = (question.words ?? session.registrationWords).map((w) =>
        w.toLowerCase(),
      );
      const correct = recalled.filter((w) => target.includes(w)).length;
      return Math.min(correct, question.maxScore);
    }

    case "serial_subtraction": {
      // answer is string[] of up to 5 numbers entered
      const entered = answer as string[];
      const expected = question.expectedAnswers ?? [];
      let pts = 0;
      entered.forEach((val, i) => {
        if (val.trim() === expected[i]) pts++;
      });
      return pts;
    }

    case "instruction_action": {
      // answer is 'correct' or 'incorrect' string from caregiver
      return answer === "correct" ? question.maxScore : 0;
    }

    case "phrase_repeat": {
      // answer is 'correct' or 'incorrect' string from caregiver
      return answer === "correct" ? question.maxScore : 0;
    }

    case "drawing_canvas": {
      // answer is 'correct' or 'incorrect' string from caregiver
      return answer === "correct" ? question.maxScore : 0;
    }

    default:
      return 0;
  }
}

export function computeSectionScores(
  answers: Record<string, any>,
  session: MMSESession,
): SectionScores {
  const scores: SectionScores = {
    Orientation: 0,
    Registration: 0,
    Attention: 0,
    Recall: 0,
    Language: 0,
  };

  MMSE_QUESTIONS.forEach((q) => {
    if (answers[q.id] !== undefined) {
      scores[q.section] += scoreAnswer(q.id, answers[q.id], session);
    }
  });

  return scores;
}

export function computeTotalScore(sectionScores: SectionScores): number {
  return Object.values(sectionScores).reduce((sum, s) => sum + s, 0);
}

export function computeSeverity(score: number): Severity {
  if (score >= 24) return "none";
  if (score >= 18) return "mild";
  if (score >= 10) return "moderate";
  return "severe";
}

export function buildScoringLog(
  answers: Record<string, any>,
  session: MMSESession,
): ScoringLogEntry[] {
  return MMSE_QUESTIONS.map((q) => ({
    questionId: q.id,
    earned:
      answers[q.id] !== undefined
        ? scoreAnswer(q.id, answers[q.id], session)
        : 0,
    max: q.maxScore,
  }));
}

export interface SeverityInfo {
  level: Severity;
  label: string;
  description: string;
  color: string;        // for UI styling
  scoreRange: string;
}

export function getSeverityInfo(score: number): SeverityInfo {
  if (score >= 24) return {
    level: 'none',
    label: 'No Impairment',
    description: 'Score indicates no signs of cognitive impairment.',
    color: 'green',
    scoreRange: '24 – 30',
  };
  if (score >= 19) return {
    level: 'mild',
    label: 'Mild Impairment',
    description: 'Score suggests mild cognitive impairment. Follow-up recommended.',
    color: 'amber',
    scoreRange: '19 – 23',
  };
  if (score >= 10) return {
    level: 'moderate',
    label: 'Moderate Impairment',
    description: 'Score suggests moderate cognitive impairment. Clinical review required.',
    color: 'orange',
    scoreRange: '10 – 18',
  };
  return {
    level: 'severe',
    label: 'Severe Impairment',
    description: 'Score suggests severe cognitive impairment. Immediate clinical attention needed.',
    color: 'red',
    scoreRange: '0 – 9',
  };
}