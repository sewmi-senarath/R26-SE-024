import { authFetch } from "@/src/api/authApi";
import { Difficulty, GameConfig, GameId } from "@/src/types/games.types";

export type PersonalizedGameContentResponse<T extends GameConfig> = {
  config: T;
  personalized: boolean;
};

let contentRequestSequence = 0;

export async function getPersonalizedGameContent<T extends GameConfig>(
  gameId: GameId,
  patientId: string,
  difficulty: Difficulty,
): Promise<PersonalizedGameContentResponse<T>> {
  contentRequestSequence += 1;
  const requestId = `${Date.now()}-${contentRequestSequence}`;
  const body = await authFetch(
    `/cognitive/games/content/${gameId}/${patientId}/${difficulty}?round=${requestId}`,
    { method: "GET" },
  );

  if (!body?.success) {
    const message =
      body?.error?.message || body?.message || "Failed to load game content.";
    throw new Error(message);
  }

  return body.data as PersonalizedGameContentResponse<T>;
}
