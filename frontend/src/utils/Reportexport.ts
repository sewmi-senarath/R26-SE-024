import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// expo-file-system v19 ships a new object API and moved the older functions to
// /legacy. The legacy path is stable and does exactly what's needed here, so
// it's the safer import for a single write-then-share.
import * as FileSystem from 'expo-file-system/legacy';
import { TaskCompletionReport } from '../types/caregiver.types';

// ── Shared helpers ─────────────────────────────────────────────────────────

const prettyDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
};

const fileStamp = () => new Date().toISOString().split('T')[0];

/**
 * Wraps a value for CSV. Any field containing a comma, quote or newline must
 * be quoted, and inner quotes doubled — otherwise a task title like
 * "Bathe, then dress" would split into two columns in Excel.
 */
const csvCell = (value: unknown): string => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Escapes text before it goes into the PDF's HTML template. */
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── CSV export ─────────────────────────────────────────────────────────────

export const exportReportAsCSV = async (report: TaskCompletionReport): Promise<void> => {
  const lines: string[] = [];

  // Header block so the file is self-describing when opened months later.
  lines.push('MemoCare - Task Completion Report');
  lines.push(`Timeframe,${csvCell(report.timeframe)}`);
  lines.push(`Period,${csvCell(`${report.startDate} to ${report.endDate}`)}`);
  lines.push(`Patient,${csvCell(report.patientFilter)}`);
  lines.push(`Generated,${csvCell(prettyDate(report.generatedAt))}`);
  lines.push('');

  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Total tasks,${report.summary.total}`);
  lines.push(`Completed,${report.summary.completed}`);
  lines.push(`Pending,${report.summary.pending}`);
  lines.push(`Overdue,${report.summary.overdue}`);
  lines.push(`Completion rate,${report.summary.completionRate}%`);
  lines.push('');

  if (report.byCategory.length > 0) {
    lines.push('BY CATEGORY');
    lines.push('Category,Total,Completed,Rate %');
    report.byCategory.forEach((c) => {
      lines.push([csvCell(c.category), c.total, c.completed, c.rate].join(','));
    });
    lines.push('');
  }

  if (report.byPriority.length > 0) {
    lines.push('BY PRIORITY');
    lines.push('Priority,Total,Completed,Rate %');
    report.byPriority.forEach((p) => {
      lines.push([csvCell(p.priority), p.total, p.completed, p.rate].join(','));
    });
    lines.push('');
  }

  lines.push('ALL TASKS');
  lines.push('Date,Time,Task,Patient,Category,Priority,Status');
  report.rows.forEach((r) => {
    lines.push([
      csvCell(r.date), csvCell(r.time), csvCell(r.title), csvCell(r.patientName),
      csvCell(r.category), csvCell(r.priority), csvCell(r.status),
    ].join(','));
  });

  // \uFEFF is a byte-order mark. Without it Excel opens the file as ASCII and
  // mangles any non-English patient names.
  const csv = '\uFEFF' + lines.join('\n');

  const uri = `${FileSystem.cacheDirectory}memocare-task-report-${fileStamp()}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Task Completion Report',
    UTI: 'public.comma-separated-values-text',
  });
};

// ── PDF export ─────────────────────────────────────────────────────────────

const buildReportHTML = (report: TaskCompletionReport): string => {
  const { summary } = report;

  const statCard = (label: string, value: string, color: string) => `
    <div class="stat">
      <div class="stat-value" style="color:${color}">${esc(value)}</div>
      <div class="stat-label">${esc(label)}</div>
    </div>`;

  const breakdownRows = (
    items: { label: string; total: number; completed: number; rate: number }[],
  ) =>
    items
      .map(
        (i) => `
      <tr>
        <td>${esc(titleCase(i.label))}</td>
        <td class="num">${i.total}</td>
        <td class="num">${i.completed}</td>
        <td class="num">
          <div class="bar-wrap">
            <div class="bar" style="width:${i.rate}%"></div>
          </div>
          <span class="rate">${i.rate}%</span>
        </td>
      </tr>`,
      )
      .join('');

  const taskRows = report.rows
    .map(
      (r) => `
      <tr>
        <td>${esc(r.date)}</td>
        <td>${esc(r.time)}</td>
        <td>${esc(r.title)}</td>
        <td>${esc(r.patientName)}</td>
        <td>${esc(titleCase(r.category))}</td>
        <td><span class="pill pill-${esc(r.priority)}">${esc(titleCase(r.priority))}</span></td>
        <td><span class="pill pill-${esc(r.status)}">${r.status === 'done' ? 'Done' : 'To do'}</span></td>
      </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #1E293B; margin: 0; padding: 32px 28px; font-size: 12px;
  }
  .brand { font-size: 13px; font-weight: 800; color: #4F8EF7; letter-spacing: 1px; }
  h1 { font-size: 22px; margin: 4px 0 6px; }
  .meta { color: #64748B; font-size: 11px; line-height: 1.6; margin-bottom: 22px; }
  .meta strong { color: #334155; }
  .rule { height: 3px; background: #4F8EF7; border-radius: 2px; margin-bottom: 22px; }

  .stats { display: flex; gap: 10px; margin-bottom: 26px; }
  .stat {
    flex: 1; border: 1px solid #E2E8F0; border-radius: 12px;
    padding: 14px 10px; text-align: center; background: #F8FAFC;
  }
  .stat-value { font-size: 22px; font-weight: 800; }
  .stat-label {
    font-size: 9px; color: #64748B; text-transform: uppercase;
    letter-spacing: 0.8px; margin-top: 3px;
  }

  h2 {
    font-size: 13px; margin: 24px 0 10px; text-transform: uppercase;
    letter-spacing: 1px; color: #64748B;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.6px; color: #64748B; padding: 7px 8px;
    border-bottom: 1.5px solid #E2E8F0;
  }
  td { padding: 7px 8px; border-bottom: 1px solid #F1F5F9; font-size: 11px; }
  td.num { text-align: right; white-space: nowrap; }

  .bar-wrap {
    display: inline-block; width: 70px; height: 6px; background: #E2E8F0;
    border-radius: 3px; overflow: hidden; vertical-align: middle; margin-right: 6px;
  }
  .bar { height: 6px; background: #4F8EF7; }
  .rate { font-weight: 700; font-size: 10px; }

  .pill {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 9px; font-weight: 700;
  }
  .pill-high   { background: #FEE2E2; color: #B91C1C; }
  .pill-medium { background: #FFEDD5; color: #C2410C; }
  .pill-low    { background: #DCFCE7; color: #15803D; }
  .pill-done   { background: #DCFCE7; color: #15803D; }
  .pill-todo   { background: #E2E8F0; color: #475569; }

  .empty { color: #94A3B8; font-style: italic; padding: 16px 0; }
  .footer {
    margin-top: 30px; padding-top: 12px; border-top: 1px solid #E2E8F0;
    font-size: 9px; color: #94A3B8; text-align: center;
  }
</style>
</head>
<body>
  <div class="brand">MEMOCARE</div>
  <h1>Task Completion Report</h1>
  <div class="meta">
    <strong>Period:</strong> ${esc(report.startDate)} to ${esc(report.endDate)}
      (${esc(titleCase(report.timeframe))})<br/>
    <strong>Patient:</strong> ${esc(report.patientFilter)}<br/>
    <strong>Generated:</strong> ${esc(prettyDate(report.generatedAt))}
  </div>
  <div class="rule"></div>

  <div class="stats">
    ${statCard('Total', String(summary.total), '#1E293B')}
    ${statCard('Completed', String(summary.completed), '#16A34A')}
    ${statCard('Pending', String(summary.pending), '#F97316')}
    ${statCard('Overdue', String(summary.overdue), '#DC2626')}
    ${statCard('Rate', `${summary.completionRate}%`, '#4F8EF7')}
  </div>

  <h2>By Category</h2>
  ${
    report.byCategory.length
      ? `<table>
          <tr><th>Category</th><th class="num">Total</th><th class="num">Done</th><th class="num">Completion</th></tr>
          ${breakdownRows(report.byCategory.map((c) => ({ label: c.category, ...c })))}
        </table>`
      : '<div class="empty">No tasks in this period.</div>'
  }

  <h2>By Priority</h2>
  ${
    report.byPriority.length
      ? `<table>
          <tr><th>Priority</th><th class="num">Total</th><th class="num">Done</th><th class="num">Completion</th></tr>
          ${breakdownRows(report.byPriority.map((p) => ({ label: p.priority, ...p })))}
        </table>`
      : '<div class="empty">No tasks in this period.</div>'
  }

  <h2>All Tasks (${report.rows.length})</h2>
  ${
    report.rows.length
      ? `<table>
          <tr><th>Date</th><th>Time</th><th>Task</th><th>Patient</th><th>Category</th><th>Priority</th><th>Status</th></tr>
          ${taskRows}
        </table>`
      : '<div class="empty">No tasks recorded in this period.</div>'
  }

  <div class="footer">
    Generated by MemoCare &middot; Confidential care record &middot;
    Share only with authorised parties
  </div>
</body>
</html>`;
};

export const exportReportAsPDF = async (report: TaskCompletionReport): Promise<void> => {
  const html = buildReportHTML(report);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Export Task Completion Report',
    UTI: 'com.adobe.pdf',
  });
};