const Task = require('../../models/caregiver/Task');

// ── Helpers ────────────────────────────────────────────────────────────────

// Matches how the frontend stores Task.date (taskService.formatDate uses
// toISOString), so the range filter lines up with what's actually in Mongo.
const toDateString = (date) => date.toISOString().split('T')[0];

/**
 * Task.date is a 'YYYY-MM-DD' string, which sorts correctly as text, so a
 * plain $gte/$lte range works without converting anything.
 */
const getDateRange = (timeframe) => {
  const end = new Date();
  const start = new Date();

  if (timeframe === 'daily') {
    // start stays as today
  } else if (timeframe === 'monthly') {
    start.setDate(end.getDate() - 29);
  } else {
    // weekly is the default
    start.setDate(end.getDate() - 6);
  }

  return { startDate: toDateString(start), endDate: toDateString(end) };
};

/**
 * Task.time is free text like "8:00 AM". Combines it with the date string
 * into a real Date for overdue comparison. Returns null when either piece
 * can't be parsed, so callers skip that task rather than guessing.
 */
const parseTaskDueDateTime = (dateStr, timeStr) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/.exec((timeStr || '').trim());
  if (!match || !dateStr) return null;

  let [, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (meridiem) {
    meridiem = meridiem.toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  }

  const result = new Date(dateStr);
  if (isNaN(result.getTime())) return null;
  result.setHours(hour, minute, 0, 0);
  return result;
};

const rate = (completed, total) =>
  total === 0 ? 0 : Math.round((completed / total) * 100);

/** Groups tasks by a field and returns total/completed/rate per group. */
const groupBy = (tasks, field) => {
  const buckets = {};

  for (const t of tasks) {
    const key = t[field] || 'other';
    if (!buckets[key]) buckets[key] = { total: 0, completed: 0 };
    buckets[key].total += 1;
    if (t.status === 'done') buckets[key].completed += 1;
  }

  return Object.entries(buckets)
    .map(([key, v]) => ({
      key,
      total: v.total,
      completed: v.completed,
      rate: rate(v.completed, v.total),
    }))
    .sort((a, b) => b.total - a.total);
};

// ── GET task completion report ─────────────────────────────────────────────
const getTaskCompletionReport = async (req, res) => {
  try {
    const { timeframe = 'weekly', patientName } = req.query;
    const caregiverId = req.user.userId;

    const { startDate, endDate } = getDateRange(timeframe);

    const filter = {
      caregiverId,
      date: { $gte: startDate, $lte: endDate },
    };

    // 'All Patients' (or nothing) means no patient filter at all.
    if (patientName && patientName !== 'All Patients') {
      filter.patientName = patientName;
    }

    const tasks = await Task.find(filter).sort({ date: 1, createdAt: 1 });

    // ── Summary ──
    const total     = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const pending   = total - completed;

    const now = Date.now();
    const overdue = tasks.filter((t) => {
      if (t.status !== 'todo') return false;
      const dueAt = parseTaskDueDateTime(t.date, t.time);
      return dueAt ? dueAt.getTime() < now : false;
    }).length;

    // ── Per-day trend ──
    const dayBuckets = {};
    for (const t of tasks) {
      if (!dayBuckets[t.date]) dayBuckets[t.date] = { total: 0, completed: 0 };
      dayBuckets[t.date].total += 1;
      if (t.status === 'done') dayBuckets[t.date].completed += 1;
    }
    const byDay = Object.entries(dayBuckets)
      .map(([date, v]) => ({
        date,
        total: v.total,
        completed: v.completed,
        rate: rate(v.completed, v.total),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      report: {
        type: 'Task Completion',
        timeframe,
        startDate,
        endDate,
        patientFilter: patientName || 'All Patients',
        generatedAt: new Date().toISOString(),
        summary: {
          total,
          completed,
          pending,
          overdue,
          completionRate: rate(completed, total),
        },
        byCategory: groupBy(tasks, 'category').map((g) => ({
          category: g.key, total: g.total, completed: g.completed, rate: g.rate,
        })),
        byPriority: groupBy(tasks, 'priority').map((g) => ({
          priority: g.key, total: g.total, completed: g.completed, rate: g.rate,
        })),
        byPatient: groupBy(tasks, 'patientName').map((g) => ({
          patientName: g.key, total: g.total, completed: g.completed, rate: g.rate,
        })),
        byDay,
        // Flat rows — this is what the CSV export writes out.
        rows: tasks.map((t) => ({
          date:        t.date,
          time:        t.time,
          title:       t.title,
          patientName: t.patientName,
          category:    t.category,
          priority:    t.priority,
          status:      t.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTaskCompletionReport };