import { authFetch } from "@/src/api/authApi";
import { Difficulty, GameConfig, GameId } from "@/src/types/games.types";

export type PersonalizedGameContentResponse<T extends GameConfig> = {
  config: T;
  personalized: boolean;
};

export async function getPersonalizedGameContent<T extends GameConfig>(
  gameId: GameId,
  patientId: string,
  difficulty: Difficulty,
): Promise<PersonalizedGameContentResponse<T>> {
  const body = await authFetch(
    `/cognitive/games/content/${gameId}/${patientId}/${difficulty}`,
    { method: "GET" },
  );

  if (!body?.success) {
    const message =
      body?.error?.message || body?.message || "Failed to load game content.";
    throw new Error(message);
  }

  return body.data as PersonalizedGameContentResponse<T>;
}
