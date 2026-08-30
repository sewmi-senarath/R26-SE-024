import { BRAIN_AREA_BY_SECTION } from "@/src/constants/brainAreas";
import { GAME_CONFIGS } from "@/src/constants/games";
import { MMSESession } from "@/src/types/assessment.types";
import { TriageHistoryItem, TriageLevel } from "@/src/types/dementia.types";
import { SectionName } from "@/src/types/games.types";
import { BrainAreaStat, PatientProgress, PerGameStat, Trend } from "@/src/hooks/usePatientReport";

const TRIAGE_META: Record<TriageLevel, { label: string; color: string }> = {
  monitor: { label: "Keep Monitoring", color: "#16A34A" },
  escalate: { label: "Clinical Review Recommended", color: "#DC2626" },
};

const TREND_LABEL: Record<Trend, string> = {
  improving: "Improving",
  declining: "Declining",
  stable: "Stable",
  "insufficient-data": "Not enough data yet",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function esc(s: string) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

export interface PatientReportHtmlInput {
  patientName?: string;
  generatedAt?: Date;
  assessments: MMSESession[];
  assessmentStats: {
    count: number;
    latestScore: number | null;
    trend: Trend;
    averageScore: number | null;
  };
  gameStats: {
    totalPlays: number;
    averageScorePercent: number;
    perGame: PerGameStat[];
    brainAreaPerformance: BrainAreaStat[];
  };
  triageHistory: TriageHistoryItem[];
  progress: PatientProgress;
  latestTriagePrediction: TriageHistoryItem | null;
}

/**
 * Builds a self-contained, print-friendly HTML document summarizing a
 * patient's cognitive history - MMSE assessment trend, behavioral risk
 * screenings, and brain-game performance by targeted brain area. Handed to
 * expo-print's Print.printToFileAsync() to produce a shareable PDF.
 */
export function generatePatientReportHtml(input: PatientReportHtmlInput): string {
  const {
    patientName,
    generatedAt = new Date(),
    assessments,
    assessmentStats,
    gameStats,
    progress,
    latestTriagePrediction,
  } = input;

  const triageMeta = latestTriagePrediction ? TRIAGE_META[latestTriagePrediction.triage] : null;

  const assessmentRows = assessments
    .slice()
    .reverse()
    .map(
      (a) => `
      <tr>
        <td>${fmtDate(a.completedAt)}</td>
        <td>${a.totalScore}/30</td>
        <td>${a.severity ? esc(String(a.severity)) : "-"}</td>
      </tr>`
    )
    .join("");

  const triageRows = latestTriagePrediction
    ? Object.entries(latestTriagePrediction.probabilities)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(
          ([level, prob]) => `
        <tr>
          <td style="text-transform:capitalize;">${esc(level)}</td>
          <td>${Math.round((prob as number) * 100)}%</td>
        </tr>`
        )
        .join("")
    : "";

  const DIRECTION_HTML: Record<string, { label: string; color: string }> = {
    improved: { label: "Improving", color: "#16A34A" },
    declined: { label: "Declining", color: "#DC2626" },
    steady: { label: "Holding Steady", color: "#64748B" },
    "insufficient-data": { label: "Baseline Set", color: "#3B82F6" },
  };
  const dirMeta = DIRECTION_HTML[progress.direction];

  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const deltaColor = (n: number) => (n > 0 ? "#16A34A" : n < 0 ? "#DC2626" : "#64748B");

  const sectionDeltaRows = progress.hasComparison
    ? progress.sectionDeltas
        .map(
          (s) => `
      <tr>
        <td>${esc(s.section)}</td>
        <td>${s.baselinePercent}%</td>
        <td>${s.latestPercent}%</td>
        <td style="color:${deltaColor(s.deltaPercent)};font-weight:700;">${sign(s.deltaPercent)} pts</td>
      </tr>`
        )
        .join("")
    : "";

  const progressSection = progress.hasBaseline
    ? `<section>
        <h2>Initial Screening &amp; Progress</h2>
        <div class="banner" style="background:#F8FAFC;">
          <div>
            <div class="status-label">Overall Direction</div>
            <div class="status-value" style="color:${dirMeta.color};font-size:16px;">${dirMeta.label}</div>
          </div>
          <div style="display:flex;gap:26px;text-align:center;">
            <div>
              <div class="status-label">Baseline</div>
              <div class="status-value" style="font-size:18px;">${progress.baselineScore ?? "-"}<span style="font-size:11px;color:#94A3B8;">/30</span></div>
              <div style="font-size:9px;color:#94A3B8;">${fmtDate(progress.baselineDate)}</div>
            </div>
            <div>
              <div class="status-label">Latest</div>
              <div class="status-value" style="font-size:18px;color:${dirMeta.color};">${progress.latestScore ?? "-"}<span style="font-size:11px;color:#94A3B8;">/30</span></div>
              <div style="font-size:9px;color:#94A3B8;">${fmtDate(progress.latestDate)}</div>
            </div>
            ${
              progress.scoreDelta !== null
                ? `<div>
                    <div class="status-label">Change</div>
                    <div class="status-value" style="font-size:18px;color:${deltaColor(progress.scoreDelta)};">${sign(progress.scoreDelta)}</div>
                    <div style="font-size:9px;color:#94A3B8;">points</div>
                  </div>`
                : ""
            }
          </div>
        </div>
        <p style="margin:0 0 12px 0;color:#475569;">${esc(progress.summary)}</p>
        ${
          sectionDeltaRows
            ? `<table><thead><tr><th>Domain</th><th>Baseline</th><th>Latest</th><th>Change</th></tr></thead><tbody>${sectionDeltaRows}</tbody></table>`
            : `<div class="empty">Domain-by-domain change appears once a second assessment is completed.</div>`
        }
        ${
          progress.gameProgress
            ? `<p style="margin:12px 0 0 0;color:#475569;">Brain-game accuracy moved from <strong>${progress.gameProgress.firstAvg}%</strong> to <strong>${progress.gameProgress.recentAvg}%</strong> (<span style="color:${deltaColor(progress.gameProgress.delta)};font-weight:700;">${sign(progress.gameProgress.delta)} pts</span>).</p>`
            : ""
        }
      </section>`
    : "";

  const perGameRows = gameStats.perGame
    .map((g) => {
      const cfg = GAME_CONFIGS[g.gameId];
      const brain = BRAIN_AREA_BY_SECTION[cfg.targetSection as SectionName];
      return `
      <tr>
        <td>${esc(cfg.title)}</td>
        <td>${esc(brain?.shortArea ?? cfg.targetSection)}</td>
        <td>${g.plays || "-"}</td>
        <td>${g.plays ? g.avgPercent + "%" : "-"}</td>
        <td>${g.plays ? g.bestPercent + "%" : "-"}</td>
        <td>${fmtDate(g.lastPlayed)}</td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    color: #1E293B;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 2px 0; color: #0F172A; }
  .subtitle { color: #64748B; font-size: 12px; margin-bottom: 22px; }
  .banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F1F5F9;
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 22px;
  }
  .banner .status-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 700; }
  .banner .status-value { font-size: 18px; font-weight: 800; margin-top: 2px; }
  .stat-row { display: flex; gap: 14px; margin-bottom: 22px; }
  .stat-card {
    flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;
    padding: 12px 14px;
  }
  .stat-card .value { font-size: 20px; font-weight: 800; color: #0F172A; }
  .stat-card .label { font-size: 10px; color: #94A3B8; margin-top: 2px; }
  section { margin-bottom: 26px; page-break-inside: avoid; }
  h2 {
    font-size: 14px; color: #0F172A; margin: 0 0 10px 0;
    border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th {
    text-align: left; background: #F8FAFC; color: #64748B;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 8px 10px; border-bottom: 1px solid #E2E8F0;
  }
  td { padding: 8px 10px; border-bottom: 1px solid #F1F5F9; }
  .empty { color: #94A3B8; font-style: italic; padding: 10px 0; }
  .footnote {
    margin-top: 30px; padding-top: 14px; border-top: 1px solid #E2E8F0;
    font-size: 10px; color: #94A3B8; line-height: 1.6;
  }
  .badge {
    display: inline-block; padding: 2px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; color: #fff;
  }
</style>
</head>
<body>
  <h1>Cognitive Health Report</h1>
  <div class="subtitle">
    ${patientName ? `Patient: <strong>${esc(patientName)}</strong> &nbsp;•&nbsp; ` : ""}Generated ${generatedAt.toLocaleString()}
  </div>

  ${
    triageMeta
      ? `<div class="banner">
          <div>
            <div class="status-label">AI Triage (ML Model)</div>
            <div class="status-value" style="color:${triageMeta.color};">${triageMeta.label}</div>
          </div>
          <div style="text-align:right;">
            <div class="status-label">MMSE Trend</div>
            <div class="status-value" style="font-size:14px;">${TREND_LABEL[assessmentStats.trend]}</div>
          </div>
        </div>`
      : ""
  }

  <div class="stat-row">
    <div class="stat-card"><div class="value">${assessmentStats.count}</div><div class="label">Assessments Taken</div></div>
    <div class="stat-card"><div class="value">${gameStats.totalPlays}</div><div class="label">Games Played</div></div>
    <div class="stat-card"><div class="value">${assessmentStats.averageScore ?? "-"}</div><div class="label">Avg. MMSE Score /30</div></div>
  </div>

  ${progressSection}

  <section>
    <h2>Assessment History (MMSE)</h2>
    ${
      assessmentRows
        ? `<table><thead><tr><th>Date</th><th>Score</th><th>Severity</th></tr></thead><tbody>${assessmentRows}</tbody></table>`
        : `<div class="empty">No completed assessments yet.</div>`
    }
  </section>

  ${
    latestTriagePrediction
      ? `<section>
          <h2>Latest AI Triage (ML Model)</h2>
          <p style="margin:0 0 10px 0;color:#475569;">
            Outcome: <strong style="text-transform:capitalize;">${esc(latestTriagePrediction.triage)}</strong>
            &nbsp;•&nbsp; Confidence: <strong>${Math.round(latestTriagePrediction.confidence * 100)}%</strong>
          </p>
          <table><thead><tr><th>Triage Outcome</th><th>Model Probability</th></tr></thead><tbody>${triageRows}</tbody></table>
        </section>`
      : ""
  }

  <section>
    <h2>Brain Games - Performance by Brain Area</h2>
    ${
      perGameRows
        ? `<table><thead><tr><th>Game</th><th>Brain Area</th><th>Plays</th><th>Avg Score</th><th>Best Score</th><th>Last Played</th></tr></thead><tbody>${perGameRows}</tbody></table>`
        : `<div class="empty">No games played yet.</div>`
    }
  </section>

  <div class="footnote">
    This report was generated by MemoCare. Brain area associations reflect standard MMSE domain groupings and are
    provided for general context, not a clinical diagnosis. The AI triage is produced by MemoCare's
    machine-learning model and should be reviewed alongside a qualified clinician's assessment, not used as a
    substitute for one.
  </div>
</body>
</html>`;
}
