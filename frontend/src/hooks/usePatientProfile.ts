import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import {
  GameSessionHistoryItem,
  getPatientGameSessions,
} from "@/src/api/gameSessionApi";
import { GAME_ORDER } from "@/src/constants/games";
import { Review } from "@/src/constants/profileConstants";
import { getMe, getStoredUser } from "@/src/api/authApi";
import { MMSESession, Severity } from "@/src/types/assessment.types";
import { GameId } from "@/src/types/games.types";
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

export type ProfileStat = {
  label: string;
  value: string;
  icon: string;
  tone: string;
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

function getScorePercent(session: Pick<GameSessionHistoryItem, "score" | "maxScore">) {
  if (!session.maxScore) return 0;
  return Math.round((session.score / session.maxScore) * 100);
}

function formatRelativeDate(value?: string) {
  if (!value) return "Not played";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not played";

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86400000,
  );

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAverageSession(seconds: number) {
  if (!seconds) return "0m";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)}m`;
}

function getGameReview(averageScore: number, sessions: number) {
  if (averageScore >= 85) {
    return "Excellent recent performance. Keep the routine steady.";
  }
  if (averageScore >= 70) {
    return "Good progress overall. Short daily practice should help maintain it.";
  }
  if (averageScore >= 50) {
    return "Some areas need support. Try easier rounds and repeat familiar tasks.";
  }
  return sessions > 1
    ? "This game may need caregiver guidance and shorter sessions."
    : "A few more plays are needed before a clear pattern appears.";
}

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
  const [gameSessions, setGameSessions] = useState<GameSessionHistoryItem[]>([]);
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

        if (authUser?.id) {
          try {
            const gameHistory = await getPatientGameSessions(authUser.id);
            if (mounted) setGameSessions(gameHistory);
          } catch {
            if (mounted) setGameSessions([]);
          }
        }

        const activeSession = await loadActiveSession();
        if (activeSession?.status === "done" && mounted) {
          setLatestSession(activeSession);
          return;
        }

        if (authUser?.id) {
          const assessmentHistory = await getPatientAssessmentHistory(authUser.id);
          const latestDone = assessmentHistory.find(
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

  const appStats = useMemo<ProfileStat[]>(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const thisWeek = gameSessions.filter(
      (session) => new Date(session.completedAt) >= weekStart,
    ).length;
    const bestScore = gameSessions.reduce(
      (best, session) => Math.max(best, getScorePercent(session)),
      0,
    );
    const averageSeconds =
      gameSessions.length === 0
        ? 0
        : gameSessions.reduce((total, session) => total + session.timeTaken, 0) /
          gameSessions.length;

    return [
      {
        label: "Total Plays",
        value: String(gameSessions.length),
        icon: "game-controller-outline",
        tone: "#2563EB",
      },
      {
        label: "This Week",
        value: String(thisWeek),
        icon: "calendar-outline",
        tone: "#16A34A",
      },
      {
        label: "Best Score",
        value: `${bestScore}%`,
        icon: "trophy-outline",
        tone: "#F97316",
      },
      {
        label: "Avg. Session",
        value: formatAverageSession(averageSeconds),
        icon: "time-outline",
        tone: "#8B5CF6",
      },
    ];
  }, [gameSessions]);

  const gameReviews = useMemo<Review[]>(() => {
    return GAME_ORDER.map((gameId) => {
      const sessions = gameSessions.filter((session) => session.gameId === gameId);
      if (!sessions.length) return null;

      const bestScore = sessions.reduce(
        (best, session) => Math.max(best, getScorePercent(session)),
        0,
      );
      const averageScore =
        sessions.reduce((total, session) => total + getScorePercent(session), 0) /
        sessions.length;

      return {
        gameId: gameId as GameId,
        sessions: sessions.length,
        bestScore: `${bestScore}%`,
        lastPlayed: formatRelativeDate(sessions[0]?.completedAt),
        review: getGameReview(averageScore, sessions.length),
      };
    }).filter((review): review is Review => review !== null);
  }, [gameSessions]);

  return {
    user,
    latestSession,
    loadingScreening,
    patientLevel,
    screeningRows,
    appStats,
    gameReviews,
  };
}
