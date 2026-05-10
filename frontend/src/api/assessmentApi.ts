import { MMSESession } from "@/src/types/assessment.types";

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/cognitive`;

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type CreateSessionPayload = {
  patientId: string;
  caregiverId: string;
  locale?: string;
  administrationMode?: "assisted" | "self";
};

type SubmitAnswerPayload = {
  questionId: string;
  answer: any;
  timeSpentMs?: number;
  answeredAt?: number;
  skipped?: boolean;
};

type UpdateProgressPayload = {
  currentQuestionIndex?: number;
  questionStartTime?: number;
  timeLimit?: number | null;
  timeExpired?: boolean;
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  const body = await parseJsonSafe(res);

  if (!res.ok || !body?.success) {
    const msg =
      body?.error?.message ||
      body?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return (body as ApiSuccess<T>).data;
}

export async function startSession(
  payload: CreateSessionPayload,
): Promise<MMSESession> {
  const data = await apiRequest<{ session: MMSESession }>("/assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.session;
}

export async function submitAnswer(
  sessionId: string,
  payload: SubmitAnswerPayload,
): Promise<MMSESession> {
  const data = await apiRequest<{ session: MMSESession }>(
    `/assessments/${sessionId}/answer`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return data.session;
}

export async function completeSession(sessionId: string): Promise<MMSESession> {
  const data = await apiRequest<{ session: MMSESession }>(
    `/assessments/${sessionId}/complete`,
    { method: "POST" },
  );
  return data.session;
}

export async function updateSessionProgress(
  sessionId: string,
  payload: UpdateProgressPayload,
): Promise<MMSESession> {
  const data = await apiRequest<{ session: MMSESession }>(
    `/assessments/${sessionId}/progress`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return data.session;
}

export async function getPatientAssessmentHistory(
  patientId: string,
): Promise<MMSESession[]> {
  const data = await apiRequest<{ sessions: MMSESession[]; total: number }>(
    `/assessments/patient/${patientId}/history`,
    { method: "GET" },
  );
  return data.sessions;
}
