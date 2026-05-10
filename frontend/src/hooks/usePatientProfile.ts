import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import { getMe, getStoredUser } from "@/src/api/authApi";
import { MMSESession, Severity } from "@/src/types/assessment.types";
import { loadActiveSession } from "@/src/utils/sessionStorage";
import { useEffect, useMemo, useState } from "react";

export type UserProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  age?: string | number;
  gender?: string;
};

export type ScreeningRow = {
  section: string;
  score: number;
  max: number;
  percent: number;
};

const SECTION_MAX: Record<keyof MMSESession["sectionScores"], number> = {
  Orientation: 10,
  Registration: 3,
  Attention: 5,
  Recall: 3,
  Language: 9,
};

const fallbackUser: UserProfile = {
  fullName: "Patient",
  email: "Not available",
  age: "Not set",
  gender: "Not set",
};

export function getLevel(severity?: Severity, totalScore = 0) {
  if (severity === "none" || totalScore >= 24) return "Independent";
  if (severity === "mild" || totalScore >= 18) return "Mild Support";
  if (severity === "moderate" || totalScore >= 10) return "Guided Support";
  if (severity === "severe") return "High Support";
  return "Awaiting Screening";
}

export function getLevelDescription(level: string) {
  switch (level) {
    case "Independent":
      return "Current results suggest strong day-to-day independence.";
    case "Mild Support":
      return "Light reminders and short practice sessions are recommended.";
    case "Guided Support":
      return "Caregiver-guided routines and simpler game levels are recommended.";
    case "High Support":
      return "Frequent support and calm, familiar activities are recommended.";
    default:
      return "Complete the screening test to personalize this level.";
  }
}

export function usePatientProfile() {
  const [user, setUser] = useState<UserProfile>(fallbackUser);
  const [latestSession, setLatestSession] = useState<MMSESession | null>(null);
  const [loadingScreening, setLoadingScreening] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const stored = await getStoredUser();
        if (stored && mounted) setUser({ ...fallbackUser, ...stored });

        const meRes = await getMe();
        const authUser = meRes?.success ? meRes.data?.user : stored;
        if (authUser && mounted) setUser({ ...fallbackUser, ...authUser });

        const activeSession = await loadActiveSession();
        if (activeSession?.status === "done" && mounted) {
          setLatestSession(activeSession);
          return;
        }

        if (authUser?.id) {
          const sessions = await getPatientAssessmentHistory(authUser.id);
          const latestDone = sessions.find(
            (session) => session.status === "done",
          );
          if (latestDone && mounted) setLatestSession(latestDone);
        }
      } catch {
        // Keep the profile usable with local placeholders if the API is offline.
      } finally {
        if (mounted) setLoadingScreening(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const patientLevel = getLevel(
    latestSession?.severity,
    latestSession?.totalScore ?? 0,
  );

  const screeningRows = useMemo<ScreeningRow[]>(() => {
    if (!latestSession?.sectionScores) return [];

    return Object.entries(latestSession.sectionScores).map(
      ([section, score]) => {
        const max = SECTION_MAX[section as keyof MMSESession["sectionScores"]];
        return {
          section,
          score,
          max,
          percent: Math.round((score / max) * 100),
        };
      },
    );
  }, [latestSession]);

  return {
    user,
    latestSession,
    loadingScreening,
    patientLevel,
    screeningRows,
  };
}
