import { saveGameSession } from "@/src/api/gameSessionApi";
import { useAssessment } from "@/src/context/AssessmentContext";
import { DifficultyProgressUpdate, GameSessionResult } from "@/src/types/games.types";
import { useCallback } from "react";

export function useSaveGameSession() {
  const { patientId } = useAssessment();

  return useCallback(
    async (result: GameSessionResult): Promise<DifficultyProgressUpdate | null> => {
      const effectivePatientId = result.patientId || patientId;

      if (!effectivePatientId) {
        console.warn("Skipping game session save: missing patientId");
        return null;
      }

      try {
        const { progress } = await saveGameSession({
          ...result,
          patientId: effectivePatientId,
        });
        return progress ?? null;
      } catch (error) {
        console.warn("Failed to save game session", error);
        return null;
      }
    },
    [patientId],
  );
}
