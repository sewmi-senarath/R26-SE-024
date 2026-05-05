import { CheckInResult, DailyCheckIn } from '../types/caregiver.types';

// ── Types ──────────────────────────────────────────────────────────────────
export interface SmartRecommendation {
  id:          string;
  category:    'sleep' | 'workload' | 'emotional' | 'physical' | 'social' | 'achievement';
  title:       string;
  insight:     string;   // personalized insight based on their specific numbers
  action:      string;   // specific action to take
  duration:    string;
  priority:    'critical' | 'high' | 'medium' | 'low';
  icon:        string;
  color:       string;
  bg:          string;
  route?:      string;
  badge?:      string;
}

// ── Color map ──────────────────────────────────────────────────────────────
const COLORS = {
  sleep:       { color: '#6366F1', bg: '#EEEDFE' },
  workload:    { color: '#2563EB', bg: '#EFF6FF' },
  emotional:   { color: '#EF4444', bg: '#FEF2F2' },
  physical:    { color: '#F97316', bg: '#FFF7ED' },
  social:      { color: '#8B5CF6', bg: '#F5F3FF' },
  achievement: { color: '#22C55E', bg: '#F0FDF4' },
};

// ── Main engine function ───────────────────────────────────────────────────
export const generateRecommendations = (
  form: DailyCheckIn,
  result: CheckInResult
): SmartRecommendation[] => {

  const recs: SmartRecommendation[] = [];
  const taskCompletionRate = form.tasksCompleted / Math.max(form.tasksAssigned, 1);
  const tasksPending       = form.tasksAssigned - form.tasksCompleted;
  const overallBurden      = form.mentallyExhausted + form.emotionallyDrained + form.emotionalOverwhelm;

  // ── 1. SLEEP ANALYSIS ────────────────────────────────────────────────────
  if (form.sleepHours <= 5) {
    recs.push({
      id:       'sleep-critical',
      category: 'sleep',
      priority: 'critical',
      icon:     'moon-outline',
      ...COLORS.sleep,
      badge:    '⚠️ Critical',
      title:    'Severe Sleep Deficit Detected',
      insight:  `You only slept ${form.sleepHours} hours. Research shows that below 6 hours, cognitive performance drops by 25% and emotional regulation becomes significantly harder — which explains your current stress levels.`,
      action:   `Tonight, set a hard stop at 9:30 PM. Ask a colleague to handle any non-urgent tasks after 8 PM so you can wind down properly.`,
      duration: 'Tonight',
      route:    '/caregiver/timer',
    });
  } else if (form.sleepHours === 6) {
    recs.push({
      id:       'sleep-moderate',
      category: 'sleep',
      priority: 'high',
      icon:     'moon-outline',
      ...COLORS.sleep,
      title:    'Sleep Quality Needs Attention',
      insight:  `6 hours is below the recommended 7-8 hours for caregivers. Combined with your current workload of ${form.tasksAssigned} tasks, this creates a compounding stress effect.`,
      action:   `Try a 20-minute power nap during your lunch break today. Set an alarm — no longer than 20 minutes to avoid grogginess.`,
      duration: '20 min',
      route:    '/caregiver/timer',
    });
  }

  // ── 2. WORKLOAD ANALYSIS ─────────────────────────────────────────────────
  if (tasksPending > 5) {
    recs.push({
      id:       'workload-high',
      category: 'workload',
      priority: result.stressLevel === 'High' ? 'critical' : 'high',
      icon:     'clipboard-outline',
      ...COLORS.workload,
      badge:    tasksPending > 8 ? '🔴 Overloaded' : undefined,
      title:    'Task Overload — Prioritise Now',
      insight:  `You have ${tasksPending} pending tasks from ${form.tasksAssigned} assigned. That is a ${Math.round((1 - taskCompletionRate) * 100)}% incomplete rate. Some tasks may not need to be done today.`,
      action:   `Open your task list and mark the bottom 3 tasks as "defer to tomorrow". Focus only on the top ${Math.min(form.tasksCompleted + 2, form.tasksAssigned)} most critical ones.`,
      duration: '5 min',
      route:    '/caregiver/tasks',
    });
  } else if (taskCompletionRate >= 0.8) {
    recs.push({
      id:       'workload-good',
      category: 'achievement',
      priority: 'low',
      icon:     'trophy-outline',
      ...COLORS.achievement,
      badge:    '⭐ Great Work',
      title:    `Strong Performance Today`,
      insight:  `You completed ${form.tasksCompleted} out of ${form.tasksAssigned} tasks (${Math.round(taskCompletionRate * 100)}%) despite ${form.difficultSituations} difficult situations. That is genuinely impressive.`,
      action:   `Acknowledge your effort. Write down 1 thing that went well today before you leave — this builds psychological resilience for tomorrow.`,
      duration: '2 min',
    });
  }

  // ── 3. DIFFICULT SITUATIONS ANALYSIS ────────────────────────────────────
  if (form.difficultSituations >= 4) {
    recs.push({
      id:       'difficult-high',
      category: 'emotional',
      priority: 'high',
      icon:     'shield-outline',
      ...COLORS.emotional,
      badge:    form.difficultSituations >= 6 ? '🔴 High Exposure' : undefined,
      title:    'Emotional Decompression Needed',
      insight:  `You handled ${form.difficultSituations} difficult situations today. Each one requires emotional labour. Without decompression, these compound into burnout over time.`,
      action:   `Take a 5-minute "debrief walk" alone. As you walk, mentally replay each difficult situation and consciously "close the file" on it. This is a proven technique used by emergency responders.`,
      duration: '5 min',
      route:    '/caregiver/breathing',
    });
  }

  // ── 4. PHYSICAL TIREDNESS ANALYSIS ───────────────────────────────────────
  if (form.physicalTiredness >= 4) {
    recs.push({
      id:       'physical-tired',
      category: 'physical',
      priority: form.physicalTiredness === 5 ? 'critical' : 'high',
      icon:     'body-outline',
      ...COLORS.physical,
      badge:    form.physicalTiredness === 5 ? '🔴 Extreme' : undefined,
      title:    form.physicalTiredness === 5
        ? 'Extreme Physical Fatigue — Act Now'
        : 'High Physical Fatigue',
      insight:  `Your physical tiredness is ${form.physicalTiredness}/5 after ${form.hoursCaregiving} hours of caregiving. Physical exhaustion at this level directly impairs your ability to make good care decisions.`,
      action:   form.physicalTiredness === 5
        ? `Stop all non-urgent activities immediately. Sit down, do 5 slow deep breaths, drink water. If this persists, inform your supervisor — you may need to reduce your load today.`
        : `Do a 3-minute seated stretch right now. Focus on neck rolls, shoulder shrugs, and wrist rotations — areas most stressed by caregiving work.`,
      duration: form.physicalTiredness === 5 ? '10 min' : '3 min',
      route:    '/caregiver/stretching',
    });
  }

  // ── 5. EMOTIONAL WELLBEING ANALYSIS ──────────────────────────────────────
  if (overallBurden >= 11) {
    recs.push({
      id:       'emotional-critical',
      category: 'emotional',
      priority: 'critical',
      icon:     'heart-outline',
      ...COLORS.emotional,
      badge:    '🔴 Burnout Risk',
      title:    'Burnout Warning Signs Present',
      insight:  `Your combined emotional burden score is ${overallBurden}/15 (exhausted: ${form.mentallyExhausted}, drained: ${form.emotionallyDrained}, overwhelmed: ${form.emotionalOverwhelm}). This pattern is a clinical indicator of early burnout.`,
      action:   `Please speak to your supervisor or a trusted colleague today — not about tasks, but about how you are feeling. If this pattern continues for 3+ days, consider speaking to a healthcare professional.`,
      duration: '10 min',
    });
  } else if (form.mood <= 2) {
    recs.push({
      id:       'mood-low',
      category: 'emotional',
      priority: 'high',
      icon:     'sunny-outline',
      ...COLORS.emotional,
      title:    'Low Mood Detected',
      insight:  `Your mood is ${form.mood}/5 today. Low mood combined with caregiving work creates a risk of compassion fatigue — where you feel too emotionally depleted to connect with patients.`,
      action:   `Do one small thing for yourself in the next 30 minutes — make a cup of tea, call a friend, step outside for 3 minutes. Small positive actions break the low-mood cycle.`,
      duration: '3 min',
    });
  }

  // ── 6. BREAKS ANALYSIS ───────────────────────────────────────────────────
  if (form.breaksTaken === 0 && form.hoursCaregiving >= 6) {
    recs.push({
      id:       'breaks-none',
      category: 'physical',
      priority: 'high',
      icon:     'cafe-outline',
      ...COLORS.physical,
      badge:    '⚠️ No Breaks',
      title:    `Zero Breaks in ${form.hoursCaregiving} Hours`,
      insight:  `You have taken no breaks during ${form.hoursCaregiving} hours of caregiving. Research shows performance degrades by 20% every 2 hours without a break — and your patients receive lower quality care as a result.`,
      action:   `Take a 10-minute break RIGHT NOW. Leave the ward/room, sit somewhere quiet, and do nothing work-related. Set a timer so you do not feel guilty.`,
      duration: '10 min',
      route:    '/caregiver/timer',
    });
  }

  // ── 7. HYDRATION REMINDER (always) ───────────────────────────────────────
  if (form.hoursCaregiving >= 5) {
    recs.push({
      id:       'hydration',
      category: 'physical',
      priority: 'low',
      icon:     'water-outline',
      ...COLORS.physical,
      title:    'Hydration Check',
      insight:  `After ${form.hoursCaregiving} hours of caregiving, you have likely lost fluids through activity and stress. Even mild dehydration (1-2%) worsens fatigue and mood.`,
      action:   `Drink a full glass of water now. Keep a water bottle visible at your workstation — if you can see it, you are 3x more likely to stay hydrated.`,
      duration: '1 min',
      route:    '/caregiver/hydration',
    });
  }

  // ── Sort by priority ──────────────────────────────────────────────────────
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return max 5 recommendations
  return recs.slice(0, 5);
};

// ── Helper: get summary message ────────────────────────────────────────────
export const getSummaryMessage = (
  form: DailyCheckIn,
  result: CheckInResult
): string => {
  const taskRate = Math.round((form.tasksCompleted / Math.max(form.tasksAssigned, 1)) * 100);

  if (result.stressLevel === 'High') {
    return `You completed ${taskRate}% of tasks despite a tough day with ${form.difficultSituations} difficult situations. Here is what will help most right now:`;
  } else if (result.stressLevel === 'Moderate') {
    return `You are managing well with ${taskRate}% task completion. A few targeted actions can help you finish the day stronger:`;
  } else {
    return `Excellent day! ${taskRate}% task completion and low stress. Here are ways to maintain this balance:`;
  }
};