import { getMe, getStoredUser } from "@/src/api/authApi";
import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import { GameSessionHistoryItem, getPatientGameSessions } from "@/src/api/gameSessionApi";
import { GAME_CONFIGS, GAME_ORDER } from "@/src/constants/games";
import {
  getRiskHistory,
  getSeverityHistory,
} from "@/src/services/patient/cognitive/dementiaService";
import { MMSESession, SectionName, Severity } from "@/src/types/assessment.types";
import { RiskHistoryItem, SeverityHistoryItem } from "@/src/types/dementia.types";
import { GameId } from "@/src/types/games.types";
import { useCallback, useEffect, useState } from "react";

const SECTION_MAX: Record<SectionName, number> = {
  Orientation: 10,
  Registration: 3,
  Attention: 5,
  Recall: 3,
  Language: 9,
};

export type Trend = "improving" | "declining" | "stable" | "insufficient-data";

export interface PerGameStat {
  gameId: GameId;
  plays: number;
  avgPercent: number;
  bestPercent: number;
  lastPlayed: string | null;
}

export interface BrainAreaStat {
  section: SectionName;
  avgPercent: number;
  plays: number;
}

export interface RiskFactorFrequency {
  key: string;
  label: string;
  count: number;
  percent: number;
}

function pct(score: number, max: number) {
  if (!max) return 0;
  return Math.round((score / max) * 100);
}

const FACTOR_LABELS: Record<string, string> = {
  memoryComplaints: "Memory complaints",
  behavioralProblems: "Behavioral changes",
  confusion: "Confusion",
  disorientation: "Disorientation",
  personalityChanges: "Personality changes",
  difficultyCompletingTasks: "Difficulty with tasks",
  forgetfulness: "Forgetfulness",
};

export function usePatientReport(explicitPatientId?: string) {
  const [patientId, setPatientId] = useState<string | null>(explicitPatientId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<MMSESession[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSessionHistoryItem[]>([]);
  const [severityHistory, setSeverityHistory] = useState<SeverityHistoryItem[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskHistoryItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let id = explicitPatientId;
      if (!id) {
        const stored = await getStoredUser();
        const meRes = await getMe();
        const user = meRes?.success ? meRes.data?.user : stored;
        id = user?.id;
      }
      if (!id) {
        setError("No patient selected.");
        setLoading(false);
        return;
      }
      setPatientId(id);

      const [assessmentRes, gamesRes, severityRes, riskRes] = await Promise.all([
        getPatientAssessmentHistory(id).catch(() => []),
        getPatientGameSessions(id).catch(() => []),
        getSeverityHistory(id),
        getRiskHistory(id),
      ]);

      const doneAssessments = (assessmentRes || [])
        .filter((s) => s.status === "done")
        .sort((a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime());

      setAssessments(doneAssessments);
      setGameSessions(
        [...(gamesRes || [])].sort(
          (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        )
      );
      setSeverityHistory([...severityRes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      setRiskHistory([...riskRes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e: any) {
      setError(e?.message || "Could not load report data.");
    } finally {
      setLoading(false);
    }
  }, [explicitPatientId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Assessment stats ──────────────────────────────────────────────────
  const assessmentScores = assessments.map((a) => a.totalScore);
  const latestAssessment = assessments[assessments.length - 1] ?? null;
  const priorScores = assessmentScores.slice(0, -1);
  const priorMean = priorScores.length
    ? priorScores.reduce((s, v) => s + v, 0) / priorScores.length
    : null;

  let assessmentTrend: Trend = "insufficient-data";
  if (latestAssessment && priorMean !== null) {
    const diff = latestAssessment.totalScore - priorMean;
    if (diff >= 1.5) assessmentTrend = "improving";
    else if (diff <= -1.5) assessmentTrend = "declining";
    else assessmentTrend = "stable";
  }

  const sectionTotals: Record<string, { sum: number; count: number }> = {};
  assessments.forEach((a) => {
    Object.entries(a.sectionScores || {}).forEach(([section, score]) => {
      if (!sectionTotals[section]) sectionTotals[section] = { sum: 0, count: 0 };
      sectionTotals[section].sum += score as number;
      sectionTotals[section].count += 1;
    });
  });
  const sectionAverages: Record<string, { avgPercent: number; max: number }> = {};
  (Object.keys(SECTION_MAX) as SectionName[]).forEach((section) => {
    const t = sectionTotals[section];
    sectionAverages[section] = {
      avgPercent: t ? pct(t.sum / t.count, SECTION_MAX[section]) : 0,
      max: SECTION_MAX[section],
    };
  });

  const assessmentStats = {
    count: assessments.length,
    latestScore: latestAssessment?.totalScore ?? null,
    latestSeverity: (latestAssessment?.severity as Severity | undefined) ?? null,
    averageScore: assessmentScores.length
      ? Math.round((assessmentScores.reduce((s, v) => s + v, 0) / assessmentScores.length) * 10) / 10
      : null,
    trend: assessmentTrend,
    sectionAverages,
  };

  // ── Game stats ────────────────────────────────────────────────────────
  const perGame: PerGameStat[] = GAME_ORDER.map((gameId) => {
    const sessions = gameSessions.filter((s) => s.gameId === gameId);
    if (!sessions.length) return { gameId, plays: 0, avgPercent: 0, bestPercent: 0, lastPlayed: null };
    const percents = sessions.map((s) => pct(s.score, s.maxScore));
    return {
      gameId,
      plays: sessions.length,
      avgPercent: Math.round(percents.reduce((s, v) => s + v, 0) / percents.length),
      bestPercent: Math.max(...percents),
      lastPlayed: sessions[sessions.length - 1]?.completedAt ?? null,
    };
  });

  const brainAreaMap: Record<string, { sum: number; count: number }> = {};
  gameSessions.forEach((s) => {
    const section = GAME_CONFIGS[s.gameId]?.targetSection;
    if (!section) return;
    if (!brainAreaMap[section]) brainAreaMap[section] = { sum: 0, count: 0 };
    brainAreaMap[section].sum += pct(s.score, s.maxScore);
    brainAreaMap[section].count += 1;
  });
  const brainAreaPerformance: BrainAreaStat[] = Object.entries(brainAreaMap).map(([section, v]) => ({
    section: section as SectionName,
    avgPercent: Math.round(v.sum / v.count),
    plays: v.count,
  }));

  const allPercents = gameSessions.map((s) => pct(s.score, s.maxScore));
  const gameStats = {
    totalPlays: gameSessions.length,
    averageScorePercent: allPercents.length
      ? Math.round(allPercents.reduce((s, v) => s + v, 0) / allPercents.length)
      : 0,
    perGame,
    brainAreaPerformance,
  };

  // ── Risk factor frequency ────────────────────────────────────────────
  const factorCounts: Record<string, number> = {};
  riskHistory.forEach((r) => {
    Object.entries(r.checklist || {}).forEach(([key, val]) => {
      if (val) factorCounts[key] = (factorCounts[key] || 0) + 1;
    });
  });
  const riskFactorFrequency: RiskFactorFrequency[] = Object.entries(factorCounts)
    .map(([key, count]) => ({
      key,
      label: FACTOR_LABELS[key] ?? key,
      count,
      percent: riskHistory.length ? Math.round((count / riskHistory.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    loading,
    error,
    patientId,
    reload: load,

    assessments,
    gameSessions,
    severityHistory,
    riskHistory,

    assessmentStats,
    gameStats,
    riskFactorFrequency,

    latestSeverityPrediction: severityHistory[severityHistory.length - 1] ?? null,
    latestRiskScreening: riskHistory[riskHistory.length - 1] ?? null,
  };
}
