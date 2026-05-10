import { GameSessionResult } from "@/src/types/games.types";

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/cognitive/games`;

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type SaveGameSessionPayload = GameSessionResult & {
  patientId: string;
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

  return (body as ApiSuccess<{ session: unknown }>).data.session;
}
