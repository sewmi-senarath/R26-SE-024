import { authFetch } from '../../api/authApi';
import { StoryQuizAttempt, AnswerQuestionResult } from '../family/storyQuizService';

// Patient-side equivalent of src/services/family/storyQuizService.ts's
// generateStoryQuiz/answerStoryQuizQuestion — same request/response shape,
// just hits the patient-authorized routes so this works when mounted from
// the real patient screen (MemoryScreen.tsx/MemoryVaultUI.tsx).

export const generateStoryQuiz = async (
  memoryId: string,
  sessionId: string
): Promise<StoryQuizAttempt | null> => {
  try {
    const data = await authFetch('/patient/story-quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ memoryId, sessionId }),
    });
    return data?.success ? data.quiz : null;
  } catch (error: any) {
    console.error('Generate story quiz error:', error.message);
    return null;
  }
};

export const answerStoryQuizQuestion = async (
  attemptId: string,
  questionIndex: number,
  selectedOptionIndex: number
): Promise<AnswerQuestionResult | null> => {
  try {
    const data = await authFetch(`/patient/story-quiz/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionIndex, selectedOptionIndex }),
    });
    return data?.success ? data : null;
  } catch (error: any) {
    console.error('Answer story quiz question error:', error.message);
    return null;
  }
};
