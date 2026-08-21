import { getPersonalizedGameContent } from "@/src/api/gameContentApi";
import { getGameContent } from "@/src/constants/gameContent";
import { Difficulty, GameConfig, GameId } from "@/src/types/games.types";
import { useEffect, useMemo, useState } from "react";

export function usePersonalizedGameContent<T extends GameConfig>(
  gameId: GameId,
  difficulty: Difficulty,
  patientId?: string | null,
) {
  const fallbackConfig = useMemo(
    () => getGameContent<T>(gameId, difficulty),
    [gameId, difficulty],
  );
  const [config, setConfig] = useState<T>(fallbackConfig);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    let mounted = true;

    setConfig(fallbackConfig);
    setPersonalized(false);

    if (!patientId) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);

    getPersonalizedGameContent<T>(gameId, patientId, difficulty)
      .then((data) => {
        if (!mounted) return;
        setConfig(data.config || fallbackConfig);
        setPersonalized(Boolean(data.personalized));
      })
      .catch(() => {
        if (!mounted) return;
        setConfig(fallbackConfig);
        setPersonalized(false);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [difficulty, fallbackConfig, gameId, patientId]);

  return { config, loading, personalized };
}
