process.env.EXPO_PUBLIC_API_URL = 'https://memocare.test';

const {
  completeSession,
  getPatientAssessmentHistory,
  startSession,
  submitAnswer,
  updateSessionProgress,
} = require('../../src/api/assessmentApi');

const fetchMock = jest.fn();
global.fetch = fetchMock as typeof fetch;

function apiResponse(data: unknown, init: { ok?: boolean; status?: number } = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => ({
      success: init.ok ?? true,
      message: 'Success',
      data,
    }),
  } as Response);
}

describe('cognitive assessment API integration', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('starts an assessment using the backend request contract', async () => {
    const session = { sessionId: 'session-1', status: 'active' };
    fetchMock.mockImplementationOnce(() => apiResponse({ session }));

    const result = await startSession({
      patientId: 'patient-1',
      caregiverId: 'caregiver-1',
      locale: 'en-LK',
    });

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://memocare.test/api/cognitive/assessments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          patientId: 'patient-1',
          caregiverId: 'caregiver-1',
          locale: 'en-LK',
        }),
      }),
    );
  });

  it('submits a patient answer to the correct assessment session', async () => {
    const session = { sessionId: 'session-1', totalScore: 1 };
    fetchMock.mockImplementationOnce(() => apiResponse({ session }));
    const payload = { questionId: 'orientation-day', answer: 'Saturday', timeSpentMs: 750 };

    const result = await submitAnswer('session-1', payload);

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://memocare.test/api/cognitive/assessments/session-1/answer',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(payload) }),
    );
  });

  it('updates assessment navigation and timer progress', async () => {
    const session = { sessionId: 'session-1', currentQuestionIndex: 5 };
    fetchMock.mockImplementationOnce(() => apiResponse({ session }));
    const payload = { currentQuestionIndex: 5, timeLimit: 30, timeExpired: false };

    const result = await updateSessionProgress('session-1', payload);

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://memocare.test/api/cognitive/assessments/session-1/progress',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(payload) }),
    );
  });

  it('completes an assessment with the expected POST endpoint', async () => {
    const session = { sessionId: 'session-1', status: 'done', totalScore: 25 };
    fetchMock.mockImplementationOnce(() => apiResponse({ session }));

    const result = await completeSession('session-1');

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://memocare.test/api/cognitive/assessments/session-1/complete',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('retrieves the complete assessment history for a patient', async () => {
    const sessions = [
      { sessionId: 'session-2', status: 'done', totalScore: 23 },
      { sessionId: 'session-1', status: 'done', totalScore: 20 },
    ];
    fetchMock.mockImplementationOnce(() =>
      apiResponse({ sessions, total: sessions.length }),
    );

    const result = await getPatientAssessmentHistory('patient-1');

    expect(result).toEqual(sessions);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://memocare.test/api/cognitive/assessments/patient/patient-1/history',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
