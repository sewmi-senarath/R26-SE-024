import { getMe, getStoredUser } from "@/src/api/authApi";
import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import { GameSessionHistoryItem, getPatientGameSessions } from "@/src/api/gameSessionApi";
import { GAME_CONFIGS, GAME_ORDER } from "@/src/constants/games";
import { getSeverityHistory } from "@/src/services/patient/cognitive/dementiaService";
import { MMSESession, SectionName, Severity } from "@/src/types/assessment.types";
import { SeverityHistoryItem } from "@/src/types/dementia.types";
import { GameId } from "@/src/types/games.types";
import { useCallback, useEffect, useState } from "react";

const SECTION_MAX: Record<SectionName, number> = {
  Orientation: 10,
  Registration: 3,
  Attention: 5,
  Recall: 3,
  Language: 9,
};

const SEVERITY_RANK: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };
const SEVERITY_LABEL: Record<string, string> = {
  none: "no impairment",
  mild: "mild impairment",
  moderate: "moderate impairment",
  severe: "severe impairment",
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

export type ProgressDirection = "improved" | "declined" | "steady" | "insufficient-data";

export interface SectionDelta {
  section: SectionName;
  baselinePercent: number;
  latestPercent: number;
  deltaPercent: number; // latest - baseline (percentage points)
  max: number;
}

export interface GameProgress {
  firstAvg: number; // avg % over the earliest window of plays
  recentAvg: number; // avg % over the most recent window of plays
  delta: number; // recentAvg - firstAvg
  sampleSize: number; // plays used per window
}

/**
 * Baseline (initial screening) vs. latest snapshot of a patient's cognitive
 * standing, plus the change between them. "Baseline" is the first completed
 * MMSE assessment; "latest" is the most recent one. Deltas are latest−baseline
 * so a positive number always means improvement.
 */
export interface PatientProgress {
  hasBaseline: boolean; // >= 1 completed assessment
  hasComparison: boolean; // >= 2 completed assessments

  baselineDate: string | null;
  latestDate: string | null;
  daysBetween: number | null;

  baselineScore: number | null; // MMSE total /30
  latestScore: number | null;
  scoreDelta: number | null; // latest - baseline (points)
  scoreDeltaPercent: number | null; // relative change vs baseline

  baselineSeverity: Severity | null;
  latestSeverity: Severity | null;
  severityImproved: boolean | null; // true=less severe, false=worse, null=same/unknown

  sectionDeltas: SectionDelta[];
  strongestGain: SectionDelta | null;
  biggestDrop: SectionDelta | null;

  gameProgress: GameProgress | null;

  direction: ProgressDirection;
  summary: string; // human-readable one-liner
}

function pct(score: number, max: number) {
  if (!max) return 0;
  return Math.round((score / max) * 100);
}

export function usePatientReport(explicitPatientId?: string) {
  const [patientId, setPatientId] = useState<string | null>(explicitPatientId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<MMSESession[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSessionHistoryItem[]>([]);
  const [severityHistory, setSeverityHistory] = useState<SeverityHistoryItem[]>([]);

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

      const [assessmentRes, gamesRes, severityRes] = await Promise.all([
        getPatientAssessmentHistory(id).catch(() => []),
        getPatientGameSessions(id).catch(() => []),
        getSeverityHistory(id),
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

  // ── Progress: initial screening (baseline) vs. latest ─────────────────
  const baseline = assessments[0] ?? null;
  const latest = assessments[assessments.length - 1] ?? null;
  const hasBaseline = !!baseline;
  const hasComparison = assessments.length >= 2 && baseline !== latest;

  const sectionDeltas: SectionDelta[] = (Object.keys(SECTION_MAX) as SectionName[]).map((section) => {
    const max = SECTION_MAX[section];
    const basePct = baseline ? pct((baseline.sectionScores as any)?.[section] ?? 0, max) : 0;
    const latePct = latest ? pct((latest.sectionScores as any)?.[section] ?? 0, max) : 0;
    return {
      section,
      baselinePercent: basePct,
      latestPercent: latePct,
      deltaPercent: latePct - basePct,
      max,
    };
  });

  const rankedByGain = hasComparison
    ? [...sectionDeltas].sort((a, b) => b.deltaPercent - a.deltaPercent)
    : [];
  const strongestGain =
    rankedByGain.length && rankedByGain[0].deltaPercent > 0 ? rankedByGain[0] : null;
  const biggestDrop =
    rankedByGain.length && rankedByGain[rankedByGain.length - 1].deltaPercent < 0
      ? rankedByGain[rankedByGain.length - 1]
      : null;

  // Game progress: earliest window of plays vs most recent window (up to 3 each)
  let gameProgress: GameProgress | null = null;
  if (gameSessions.length >= 2) {
    const win = Math.min(3, Math.floor(gameSessions.length / 2) || 1);
    const early = gameSessions.slice(0, win).map((s) => pct(s.score, s.maxScore));
    const recent = gameSessions.slice(-win).map((s) => pct(s.score, s.maxScore));
    const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const firstAvg = avg(early);
    const recentAvg = avg(recent);
    gameProgress = { firstAvg, recentAvg, delta: recentAvg - firstAvg, sampleSize: win };
  }

  const baselineScore = baseline?.totalScore ?? null;
  const latestScore = latest?.totalScore ?? null;
  const scoreDelta = hasComparison && baselineScore !== null && latestScore !== null
    ? latestScore - baselineScore
    : null;
  const scoreDeltaPercent =
    scoreDelta !== null && baselineScore ? Math.round((scoreDelta / baselineScore) * 100) : null;

  const baselineSeverity = (baseline?.severity as Severity | undefined) ?? null;
  const latestSeverity = (latest?.severity as Severity | undefined) ?? null;
  let severityImproved: boolean | null = null;
  if (hasComparison && baselineSeverity && latestSeverity) {
    const d = SEVERITY_RANK[latestSeverity] - SEVERITY_RANK[baselineSeverity];
    severityImproved = d < 0 ? true : d > 0 ? false : null;
  }

  const daysBetween =
    baseline?.completedAt && latest?.completedAt && hasComparison
      ? Math.max(
          0,
          Math.round(
            (new Date(latest.completedAt).getTime() - new Date(baseline.completedAt).getTime()) /
              86400000
          )
        )
      : null;

  // Overall direction — a ±2 point MMSE swing is the meaningful threshold.
  let direction: ProgressDirection = "insufficient-data";
  if (hasComparison && scoreDelta !== null) {
    if (scoreDelta >= 2) direction = "improved";
    else if (scoreDelta <= -2) direction = "declined";
    else direction = "steady";
  }

  let summary: string;
  if (!hasBaseline) {
    summary = "No initial screening on record yet. The first completed assessment becomes the baseline.";
  } else if (!hasComparison) {
    summary = `Baseline set on ${baseline?.completedAt ? new Date(baseline.completedAt).toLocaleDateString() : "the first assessment"} at ${baselineScore}/30. Complete another assessment to start tracking change.`;
  } else {
    const span = daysBetween && daysBetween > 0 ? ` over ${daysBetween} day${daysBetween === 1 ? "" : "s"}` : "";
    const gainWord = scoreDelta! > 0 ? "up" : scoreDelta! < 0 ? "down" : "unchanged";
    const points = Math.abs(scoreDelta!);
    if (direction === "improved") {
      summary = `Cognitive score is ${gainWord} ${points} point${points === 1 ? "" : "s"} from the ${baselineScore}/30 baseline to ${latestScore}/30${span}${strongestGain ? `, with the strongest gain in ${strongestGain.section}` : ""}.`;
    } else if (direction === "declined") {
      summary = `Cognitive score has slipped ${points} point${points === 1 ? "" : "s"} from the ${baselineScore}/30 baseline to ${latestScore}/30${span}${biggestDrop ? `, most notably in ${biggestDrop.section}` : ""}.`;
    } else {
      summary = `Cognitive score is holding steady near the ${baselineScore}/30 baseline (now ${latestScore}/30)${span}.`;
    }
    if (severityImproved === true && baselineSeverity && latestSeverity) {
      summary += ` Severity eased from ${SEVERITY_LABEL[baselineSeverity]} to ${SEVERITY_LABEL[latestSeverity]}.`;
    } else if (severityImproved === false && baselineSeverity && latestSeverity) {
      summary += ` Severity progressed from ${SEVERITY_LABEL[baselineSeverity]} to ${SEVERITY_LABEL[latestSeverity]}.`;
    }
  }

  const progress: PatientProgress = {
    hasBaseline,
    hasComparison,
    baselineDate: baseline?.completedAt ?? null,
    latestDate: latest?.completedAt ?? null,
    daysBetween,
    baselineScore,
    latestScore,
    scoreDelta,
    scoreDeltaPercent,
    baselineSeverity,
    latestSeverity,
    severityImproved,
    sectionDeltas,
    strongestGain,
    biggestDrop,
    gameProgress,
    direction,
    summary,
  };

  return {
    loading,
    error,
    patientId,
    reload: load,

    assessments,
    gameSessions,
    severityHistory,

    assessmentStats,
    gameStats,
    progress,

    latestSeverityPrediction: severityHistory[severityHistory.length - 1] ?? null,
  };
}
