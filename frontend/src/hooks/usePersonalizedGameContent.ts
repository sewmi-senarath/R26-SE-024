import { getPersonalizedGameContent } from "@/src/api/gameContentApi";
import { getGameContent } from "@/src/constants/gameContent";
import { Difficulty, GameConfig, GameId } from "@/src/types/games.types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function usePersonalizedGameContent<T extends GameConfig>(
  gameId: GameId,
  difficulty: Difficulty,
  patientId?: string | null,
) {
  const [contentDifficulty, setContentDifficulty] = useState(difficulty);
  const [refreshKey, setRefreshKey] = useState(0);
  const fallbackConfig = useMemo(
    () => getGameContent<T>(gameId, contentDifficulty),
    [contentDifficulty, gameId],
  );
  const [config, setConfig] = useState<T>(fallbackConfig);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    setContentDifficulty(difficulty);
  }, [difficulty]);

  const refresh = useCallback(
    (nextDifficulty?: Difficulty) => {
      setLoading(Boolean(patientId));
      setContentDifficulty((current) => nextDifficulty ?? current);
      setRefreshKey((current) => current + 1);
    },
    [patientId],
  );

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

    getPersonalizedGameContent<T>(gameId, patientId, contentDifficulty)
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
  }, [contentDifficulty, fallbackConfig, gameId, patientId, refreshKey]);

  return {
    config,
    loading,
    personalized,
    refresh,
    difficulty: contentDifficulty,
  };
}
