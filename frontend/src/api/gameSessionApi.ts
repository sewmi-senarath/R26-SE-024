import {
  DifficultyGameReport,
  DifficultyProgressUpdate,
  GameSessionResult,
  PatientGameProgress,
} from "@/src/types/games.types";
import { authFetch } from "./authApi";

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/cognitive/games`;

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type SaveGameSessionPayload = GameSessionResult & {
  patientId: string;
};

export type GameSessionHistoryItem = Omit<
  GameSessionResult,
  "timeTakenSeconds"
> & {
  id?: string;
  _id?: string;
  patientId: string;
  timeTaken: number;
};

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function saveGameSession(payload: SaveGameSessionPayload) {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      timeTaken: payload.timeTakenSeconds,
    }),
  });

  const body = await parseJsonSafe(res);

  if (!res.ok || !body?.success) {
    const msg =
      body?.error?.message ||
      body?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return (body as ApiSuccess<{ session: unknown; progress: DifficultyProgressUpdate | null }>)
    .data;
}

export async function getPatientGameProgress(
  patientId: string,
): Promise<PatientGameProgress[]> {
  const body = await authFetch(`/cognitive/games/progress/${patientId}`, {
    method: "GET",
  });

  if (!body?.success) {
    throw new Error(body?.error?.message || body?.message || "Request failed");
  }

  return body.data?.progress || [];
}

export async function getPatientDifficultyReport(
  patientId: string,
): Promise<DifficultyGameReport[]> {
  const body = await authFetch(`/cognitive/games/progress/${patientId}/report`, {
    method: "GET",
  });

  if (!body?.success) {
    throw new Error(body?.error?.message || body?.message || "Request failed");
  }

  return body.data?.report || [];
}

export async function getPatientGameSessions(
  patientId: string,
): Promise<GameSessionHistoryItem[]> {
  const body = await authFetch(`/cognitive/games/sessions/patient/${patientId}`, {
    method: "GET",
  });

  if (!body?.success) {
    throw new Error(body?.error?.message || body?.message || "Request failed");
  }

  return body.data?.sessions || [];
}
