// import { BurnoutRisk, CheckInResult, DailyCheckIn } from '../types/caregiver.types';

// // ── Types ──────────────────────────────────────────────────────────────────
// export interface SmartRecommendation {
//   id:              string;
//   category:        string;
//   title:           string;
//   primaryCause:    string;
//   reason:          string;
//   recommendations: string[];
//   priority:        'High' | 'Medium' | 'Low';
//   expectedBenefit: string;
//   icon:            string;
//   color:           string;
//   bg:              string;
// }

// // ── Main engine ────────────────────────────────────────────────────────────
// export const generateRecommendations = (
//   form:       DailyCheckIn,
//   result:     CheckInResult,
//   suppressed: string[] = [],
//   boosted:    string[] = [],
//   weekly?:    BurnoutRisk,
// ): SmartRecommendation[] => {

//   const recs: SmartRecommendation[] = [];
//   const pending        = Math.max(0, form.tasksAssigned - form.tasksCompleted);
//   const emotionalTotal = form.emotionalOverwhelm + form.mentallyExhausted + form.emotionallyDrained;
//   const completionPct  = Math.round((form.tasksCompleted / Math.max(form.tasksAssigned, 1)) * 100);

//   // ── 1. SLEEP ─────────────────────────────────────────────────────────────
//   if (form.sleepHours < 6 && !suppressed.includes('sleep')) {
//     const isCritical = form.sleepHours <= 4;
//     recs.push({
//       id:           'sleep',
//       category:     'Sleep Management',
//       icon:         'moon-outline',
//       color:        '#6366F1',
//       bg:           '#EEF2FF',
//       title:        isCritical ? 'Severe Sleep Deficit Detected' : 'Insufficient Sleep',
//       primaryCause: 'Sleep Deficit',
//       reason:       `The caregiver slept only ${form.sleepHours} hour${form.sleepHours === 1 ? '' : 's'} last night, which is ${6 - form.sleepHours} hour${6 - form.sleepHours === 1 ? '' : 's'} below the minimum 6-hour threshold. This level of sleep deprivation increases fatigue, impairs decision-making, and significantly raises stress levels. Combined with ${form.hoursCaregiving} hours of caregiving today, the risk of burnout is ${isCritical ? 'very high' : 'elevated'}.`,
//       recommendations: [
//         `Sleep at least ${isCritical ? '8–9' : '7–8'} hours tonight without interruption.`,
//         'Reduce or eliminate overnight caregiving duties this evening.',
//         'Ask a family member or colleague to cover the late shift.',
//         'Maintain a consistent sleep schedule — same bedtime every night.',
//         'Avoid screens and caffeine at least 1 hour before bed.',
//       ],
//       priority:        isCritical ? 'High' : 'High',
//       expectedBenefit: `Reduce fatigue and restore cognitive function within 1–2 nights. Improved sleep will lower your stress score by an estimated 2–3 points and enhance emotional resilience for caregiving.`,
//     });
//   }

//   // ── 2. EMOTIONAL BURDEN ───────────────────────────────────────────────────
//   if (form.emotionalOverwhelm >= 4 && !suppressed.includes('emotional')) {
//     const isExtreme = emotionalTotal >= 12;
//     recs.push({
//       id:           'emotional',
//       category:     'Emotional Support',
//       icon:         'heart-outline',
//       color:        '#EF4444',
//       bg:           '#FEF2F2',
//       title:        isExtreme ? 'Critical Emotional Overload' : 'High Emotional Burden',
//       primaryCause: 'Emotional Overload',
//       reason:       `The caregiver reported an emotional overwhelm score of ${form.emotionalOverwhelm}/5, mental exhaustion of ${form.mentallyExhausted}/5, and emotional drain of ${form.emotionallyDrained}/5 — giving a combined emotional burden of ${emotionalTotal}/15. This is ${isExtreme ? 'dangerously high' : 'significantly elevated'} and is the primary driver of today's ${result.stressLevel.toLowerCase()} stress prediction. Handling ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today has compounded this burden.`,
//       recommendations: [
//         'Practice 5 minutes of deep breathing right now: inhale 4 counts, hold 4, exhale 6.',
//         'Take a 10-minute mindfulness break — focus only on your breathing, nothing else.',
//         isExtreme
//           ? 'Contact a professional counsellor or mental health helpline today — this is urgent.'
//           : 'Talk to a trusted colleague or friend about how you are feeling.',
//         'Journal 3 things you handled well today — acknowledge your own strength.',
//         'Schedule a proper decompression activity tonight: walk, music, or a warm bath.',
//       ],
//       priority:        isExtreme ? 'High' : 'High',
//       expectedBenefit: `Reduce emotional exhaustion and lower cortisol levels within hours. Regular practice of these techniques can reduce your emotional burden score by 30–40% over one week.`,
//     });
//   }

//   // ── 3. PENDING TASKS ──────────────────────────────────────────────────────
//   if (pending > 10 && !suppressed.includes('workload-high')) {
//     recs.push({
//       id:           'workload-high',
//       category:     'Workload Management',
//       icon:         'clipboard-outline',
//       color:        '#2563EB',
//       bg:           '#EFF6FF',
//       title:        'Critical Task Overload',
//       primaryCause: 'Excessive Pending Tasks',
//       reason:       `The caregiver has ${pending} tasks still pending from ${form.tasksAssigned} assigned today, achieving only a ${completionPct}% completion rate. With ${pending} unfinished tasks, the accumulated workload pressure is a major contributor to the current ${result.stressLevel.toLowerCase()} stress level. This volume of unfinished work creates cognitive overload and anxiety that persists beyond the shift.`,
//       recommendations: [
//         `Immediately identify the top 3 most critical tasks from the ${pending} pending — focus only on those.`,
//         'Delegate non-urgent tasks to available family members or colleagues right now.',
//         `Defer at least ${Math.floor(pending / 2)} of the lower-priority tasks to tomorrow with supervisor approval.`,
//         'Communicate your workload situation clearly to your supervisor today.',
//         'Use a simple priority matrix: list tasks as Urgent/Important vs Can Wait.',
//       ],
//       priority:        'High',
//       expectedBenefit: `Reducing your active task load to under 5 tasks will significantly lower anxiety and improve focus, potentially reducing your stress score by 2–3 points immediately.`,
//     });
//   } else if (pending > 5 && pending <= 10 && !suppressed.includes('workload-moderate')) {
//     recs.push({
//       id:           'workload-moderate',
//       category:     'Workload Management',
//       icon:         'clipboard-outline',
//       color:        '#2563EB',
//       bg:           '#EFF6FF',
//       title:        'Workload Needs Attention',
//       primaryCause: 'Elevated Task Backlog',
//       reason:       `The caregiver completed ${form.tasksCompleted} out of ${form.tasksAssigned} assigned tasks today (${completionPct}% completion), leaving ${pending} tasks pending. While not critical, this backlog creates ongoing stress and risks escalating if not addressed. The combination of ${form.hoursCaregiving} hours of caregiving and ${pending} unfinished tasks is unsustainable.`,
//       recommendations: [
//         'Review the pending tasks and rank them by urgency before leaving today.',
//         `Delegate at least ${Math.ceil(pending / 2)} of the ${pending} pending tasks to a colleague.`,
//         'Block the first 30 minutes of tomorrow to clear the most important pending tasks.',
//         'Discuss workload distribution with your supervisor if this pattern continues.',
//       ],
//       priority:        'Medium',
//       expectedBenefit: `Clearing the task backlog will reduce end-of-shift anxiety and improve your starting position tomorrow, lowering overall stress by an estimated 15–20%.`,
//     });
//   }

//   // ── 4. BREAKS ─────────────────────────────────────────────────────────────
//   if (form.breaksTaken === 0 && !suppressed.includes('no-breaks')) {
//     recs.push({
//       id:           'no-breaks',
//       category:     'Time Management',
//       icon:         'cafe-outline',
//       color:        '#22C55E',
//       bg:           '#F0FDF4',
//       title:        'Zero Breaks in Entire Shift',
//       primaryCause: 'No Recovery Time',
//       reason:       `The caregiver took zero breaks during ${form.hoursCaregiving} hours of continuous caregiving today. Research consistently shows that performance degrades by approximately 20% every 2 hours without a break, and the risk of caregiving errors increases significantly. No breaks also means no physical or mental recovery time, which directly contributes to the ${result.stressLevel.toLowerCase()} stress level recorded today.`,
//       recommendations: [
//         'Take a 10–15 minute break RIGHT NOW — step completely away from your duties.',
//         'During your break: go outside, sit quietly, or do gentle stretching — nothing work-related.',
//         'Set a recurring phone alarm every 90–120 minutes for future break reminders.',
//         'Eat something nutritious during your next break — skipping meals worsens stress.',
//         'Even a 5-minute walk to a different room significantly improves mental clarity.',
//       ],
//       priority:        'High',
//       expectedBenefit: `Taking regular breaks can restore up to 80% of your cognitive performance. A single 15-minute break now will improve your focus, reduce irritability, and lower your stress hormones measurably within the hour.`,
//     });
//   } else if (form.breaksTaken <= 1 && form.hoursCaregiving >= 6 && !suppressed.includes('few-breaks')) {
//     recs.push({
//       id:           'few-breaks',
//       category:     'Time Management',
//       icon:         'cafe-outline',
//       color:        '#22C55E',
//       bg:           '#F0FDF4',
//       title:        'Insufficient Break Frequency',
//       primaryCause: 'Inadequate Rest Periods',
//       reason:       `The caregiver took only ${form.breaksTaken} break${form.breaksTaken === 1 ? '' : 's'} during ${form.hoursCaregiving} hours of caregiving. The recommended minimum is one break every 2 hours. With only ${form.breaksTaken} break${form.breaksTaken === 1 ? '' : 's'}, your body and mind have had insufficient time to recover from the physical and emotional demands of caregiving today.`,
//       recommendations: [
//         `For the remaining ${Math.max(1, form.hoursCaregiving - 6)} hours of your shift, take at least one more break immediately.`,
//         'Each break should be at least 10 minutes and away from the caregiving environment.',
//         'Combine breaks with hydration — drink a full glass of water each time.',
//         'Plan tomorrow\'s breaks in advance: schedule them as non-negotiable appointments.',
//       ],
//       priority:        'Medium',
//       expectedBenefit: `Increasing break frequency will restore energy levels and reduce cumulative fatigue. Caregivers who take regular breaks report 35% lower end-of-shift exhaustion scores.`,
//     });
//   }

//   // ── 5. MOOD ───────────────────────────────────────────────────────────────
//   if (form.mood <= 2 && !suppressed.includes('mood')) {
//     recs.push({
//       id:           'mood',
//       category:     'Relaxation Activities',
//       icon:         'sunny-outline',
//       color:        '#EC4899',
//       bg:           '#FDF2F8',
//       title:        form.mood === 1 ? 'Very Low Mood — Urgent Support Needed' : 'Low Mood Detected',
//       primaryCause: 'Low Mood',
//       reason:       `The caregiver rated their mood at only ${form.mood}/5 today. This significantly low mood — particularly in the context of ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} and a ${result.stressLevel.toLowerCase()} stress prediction — indicates a risk of compassion fatigue. Low mood in caregivers directly impairs the quality of patient interactions and increases the likelihood of burnout if unaddressed.`,
//       recommendations: [
//         'Listen to your favourite calming or uplifting music for at least 10 minutes now.',
//         'Step outside for a 5-minute walk — natural light and fresh air are evidence-based mood boosters.',
//         'Call or message a trusted friend or family member — connection is a powerful antidote to low mood.',
//         'Write down one thing — however small — that went well today. Finding positives rewires your stress response.',
//         form.mood === 1
//           ? 'If this low mood persists for several days, please speak to a mental health professional.'
//           : 'Treat yourself to one small act of self-care this evening — you have earned it.',
//       ],
//       priority:        form.mood === 1 ? 'High' : 'Medium',
//       expectedBenefit: `These activities can elevate mood within 20–30 minutes through natural neurotransmitter release. Addressing low mood early prevents escalation to clinical depression, which affects 1 in 3 long-term caregivers.`,
//     });
//   }

//   // ── 6. PHYSICAL TIREDNESS ────────────────────────────────────────────────
//   if (form.physicalTiredness >= 4 && !suppressed.includes('physical')) {
//     const isExtreme = form.physicalTiredness === 5;
//     recs.push({
//       id:           'physical',
//       category:     'Physical Wellbeing',
//       icon:         'body-outline',
//       color:        '#F97316',
//       bg:           '#FFF7ED',
//       title:        isExtreme ? 'Extreme Physical Exhaustion' : 'High Physical Fatigue',
//       primaryCause: 'Physical Exhaustion',
//       reason:       `The caregiver reported physical tiredness of ${form.physicalTiredness}/5 after ${form.hoursCaregiving} hours of caregiving. At this level of physical fatigue, the risk of caregiving errors increases by up to 40% according to healthcare research. Physical exhaustion also amplifies emotional stress — the two feed each other in a cycle that accelerates burnout.`,
//       recommendations: [
//         isExtreme
//           ? 'Stop all non-essential physical activities immediately and inform your supervisor.'
//           : 'Request a reduction in physically demanding tasks for the remainder of your shift.',
//         'Drink a full glass of water now — dehydration dramatically worsens physical fatigue.',
//         'Do a 3-minute seated stretch: neck rolls, shoulder shrugs, ankle rotations, wrist circles.',
//         'Eat a small nutritious snack if you have not eaten recently — low blood sugar intensifies fatigue.',
//         'Schedule proper rest periods into tomorrow\'s shift plan before it begins.',
//       ],
//       priority:        isExtreme ? 'High' : 'Medium',
//       expectedBenefit: `Addressing physical fatigue now prevents compounding exhaustion. Hydration alone can reduce fatigue symptoms by 15–20% within 30 minutes. Planned rest periods will restore physical capacity for safe caregiving.`,
//     });
//   }

//   // ── 7. DIFFICULT SITUATIONS ───────────────────────────────────────────────
//   if (form.difficultSituations >= 4 && !suppressed.includes('difficult')) {
//     const isSevere = form.difficultSituations >= 6;
//     recs.push({
//       id:           'difficult',
//       category:     'Stress Management',
//       icon:         'shield-outline',
//       color:        '#8B5CF6',
//       bg:           '#F5F3FF',
//       title:        isSevere ? 'High Exposure to Trauma Events' : 'Emotional Decompression Needed',
//       primaryCause: 'High Exposure to Difficult Situations',
//       reason:       `The caregiver encountered ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today — including patient confusion and agitation episodes. Each of these events requires significant emotional labour and leaves a physiological stress residue. Without deliberate decompression, these accumulate into secondary traumatic stress and eventual burnout. This is one of the key factors in today's ${result.stressLevel.toLowerCase()} stress prediction.`,
//       recommendations: [
//         'Take a 5-minute "debrief walk" alone right now — mentally review each situation and consciously release it.',
//         'Use the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8 counts. Repeat 4 times.',
//         isSevere
//           ? 'Speak to your supervisor or a mental health professional about today\'s experiences — this level of exposure requires formal debriefing.'
//           : 'Share the experience with a trusted colleague — verbalising difficult events reduces their psychological weight.',
//         'Write briefly about what happened — journalling trauma events reduces their emotional impact by 30%.',
//         'Remind yourself: these patient behaviours are symptoms of dementia, not personal.',
//       ],
//       priority:        isSevere ? 'High' : 'Medium',
//       expectedBenefit: `Deliberate decompression after difficult incidents prevents accumulation of traumatic stress. Caregivers who debrief regularly report 45% lower burnout rates and sustain higher quality care over time.`,
//     });
//   }

//   // ── 8. COUNSELLING (very high stress + emotional) ─────────────────────────
//   if (
//     result.stressLevel === 'High' &&
//     emotionalTotal >= 11 &&
//     !suppressed.includes('counselling')
//   ) {
//     recs.push({
//       id:           'counselling',
//       category:     'Professional Counselling',
//       icon:         'chatbubbles-outline',
//       color:        '#06B6D4',
//       bg:           '#ECFEFF',
//       title:        'Professional Support Recommended',
//       primaryCause: 'Sustained High Stress Pattern',
//       reason:       `The caregiver's combined stress indicators — ${result.stressLevel} stress level, emotional burden of ${emotionalTotal}/15, and ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today — suggest that professional psychological support would be significantly beneficial. Self-care strategies alone may be insufficient at this stress level without professional guidance.`,
//       recommendations: [
//         'Schedule an appointment with a counsellor or psychologist this week — do not delay.',
//         'Contact a caregiver-specific support helpline for immediate telephone support.',
//         'Speak honestly with your supervisor about your current mental health state.',
//         'Join a dementia caregiver support group to connect with others who understand your experience.',
//         'Ask your GP about caregiver mental health support programmes available in your area.',
//       ],
//       priority:        'High',
//       expectedBenefit: `Professional counselling has demonstrated a 60% reduction in caregiver burnout symptoms in clinical studies. Early intervention prevents escalation to clinical depression and extends your capacity to provide quality care.`,
//     });
//   }

//   // ── 9. FAMILY SUPPORT ────────────────────────────────────────────────────
//   if (
//     result.stressLevel !== 'Low' &&
//     pending > 5 &&
//     !suppressed.includes('family')
//   ) {
//     recs.push({
//       id:           'family',
//       category:     'Family Support',
//       icon:         'people-outline',
//       color:        '#F59E0B',
//       bg:           '#FFFBEB',
//       title:        'Involve Family in Caregiving',
//       primaryCause: 'Caregiver Isolation',
//       reason:       `With ${pending} pending tasks and ${result.stressLevel.toLowerCase()} stress, the caregiver appears to be managing too much alone. Research shows that caregivers with active family support systems experience 40% lower burnout rates. Sharing the ${form.tasksAssigned} daily tasks across family members creates a more sustainable caregiving model.`,
//       recommendations: [
//         'Contact a family member today with a specific, concrete request for help — not a general "I need help."',
//         'List which of the ${pending} pending tasks can be handled by non-professional family members.',
//         'Schedule a family meeting this week to redistribute caregiving responsibilities fairly.',
//         'Share this stress assessment with family to help them understand the urgency.',
//         'Remember: asking for help is a sign of strength, not weakness.',
//       ],
//       priority:        'Medium',
//       expectedBenefit: `Distributing caregiving responsibilities across family members can reduce your personal task load by 30–50%, directly lowering stress scores and preventing long-term burnout.`,
//     });
//   }

//   // ── 10. HYDRATION ─────────────────────────────────────────────────────────
//   if (form.hoursCaregiving >= 5 && !suppressed.includes('hydration')) {
//     recs.push({
//       id:           'hydration',
//       category:     'Healthy Lifestyle',
//       icon:         'water-outline',
//       color:        '#84CC16',
//       bg:           '#F7FEE7',
//       title:        'Hydration & Nutrition Check',
//       primaryCause: 'Dehydration Risk',
//       reason:       `After ${form.hoursCaregiving} hours of active caregiving, the body loses significant fluids through physical activity and stress-related perspiration. Even mild dehydration of just 1–2% of body weight worsens fatigue by 15%, impairs concentration, and negatively affects mood — all of which compound the already ${result.stressLevel.toLowerCase()} stress state recorded today.`,
//       recommendations: [
//         'Drink a full glass of water (250ml) right now before doing anything else.',
//         'Keep a visible water bottle at your workstation — visibility increases consumption by 3x.',
//         'Aim for 8 glasses (2 litres) of water throughout the day.',
//         'Eat a nutritious meal or snack within the next hour if you have not done so.',
//         'Avoid excessive coffee — it dehydrates and increases anxiety at high stress levels.',
//       ],
//       priority:        'Low',
//       expectedBenefit: `Proper hydration can reduce fatigue symptoms by 15–20% within 30 minutes and improve mood and concentration. Consistent hydration throughout caregiving shifts is one of the simplest and most effective wellbeing interventions.`,
//     });
//   }

//   // ── Sort: priority order, then boost ──────────────────────────────────────
//   const ORDER = { High: 0, Medium: 1, Low: 2 };
//   recs.sort((a, b) => {
//     const aBoost = boosted.includes(a.id) ? -1 : 0;
//     const bBoost = boosted.includes(b.id) ? -1 : 0;
//     if (aBoost !== bBoost) return aBoost - bBoost;
//     return ORDER[a.priority] - ORDER[b.priority];
//   });

//   return recs.slice(0, 5);
// };

// // ── Summary message ────────────────────────────────────────────────────────
// export const getSummaryMessage = (
//   form:   DailyCheckIn,
//   result: CheckInResult,
// ): string => {
//   const rate    = Math.round((form.tasksCompleted / Math.max(form.tasksAssigned, 1)) * 100);
//   const pending = form.tasksAssigned - form.tasksCompleted;

//   if (result.stressLevel === 'High') {
//     return `You completed ${rate}% of tasks (${form.tasksCompleted}/${form.tasksAssigned}) despite a tough day with ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''}. Here is what will help most right now:`;
//   } else if (result.stressLevel === 'Moderate') {
//     return `You are managing well with ${rate}% task completion and ${form.breaksTaken} break${form.breaksTaken !== 1 ? 's' : ''} taken. A few targeted actions can help you finish the day stronger:`;
//   }
//   return `Excellent work today — ${rate}% task completion with low stress. Here are tips to maintain this positive balance:`;
// };

import { BurnoutRisk, CheckInResult, DailyCheckIn } from '../types/caregiver.types';

// ── Types ──────────────────────────────────────────────────────────────────
export interface SmartRecommendation {
  id:              string;
  category:        string;
  title:           string;
  primaryCause:    string;
  reason:          string;
  recommendations: string[];
  priority:        'High' | 'Medium' | 'Low';
  expectedBenefit: string;
  icon:            string;
  color:           string;
  bg:              string;
}

// ── Main engine ────────────────────────────────────────────────────────────
export const generateRecommendations = (
  form:       DailyCheckIn,
  result:     CheckInResult,
  suppressed: string[] = [],
  boosted:    string[] = [],
  weekly?:    BurnoutRisk, // ← NEW: weekly trend / burnout context (optional — undefined is safe)
): SmartRecommendation[] => {

  const recs: SmartRecommendation[] = [];
  const pending        = Math.max(0, form.tasksAssigned - form.tasksCompleted);
  const emotionalTotal = form.emotionalOverwhelm + form.mentallyExhausted + form.emotionallyDrained;
  const completionPct  = Math.round((form.tasksCompleted / Math.max(form.tasksAssigned, 1)) * 100);

  // ── 1. SLEEP ─────────────────────────────────────────────────────────────
  if (form.sleepHours < 6 && !suppressed.includes('sleep')) {
    const isCritical = form.sleepHours <= 4;
    recs.push({
      id:           'sleep',
      category:     'Sleep Management',
      icon:         'moon-outline',
      color:        '#6366F1',
      bg:           '#EEF2FF',
      title:        isCritical ? 'Severe Sleep Deficit Detected' : 'Insufficient Sleep',
      primaryCause: 'Sleep Deficit',
      reason:       `The caregiver slept only ${form.sleepHours} hour${form.sleepHours === 1 ? '' : 's'} last night, which is ${6 - form.sleepHours} hour${6 - form.sleepHours === 1 ? '' : 's'} below the minimum 6-hour threshold. This level of sleep deprivation increases fatigue, impairs decision-making, and significantly raises stress levels. Combined with ${form.hoursCaregiving} hours of caregiving today, the risk of burnout is ${isCritical ? 'very high' : 'elevated'}.`,
      recommendations: [
        `Sleep at least ${isCritical ? '8–9' : '7–8'} hours tonight without interruption.`,
        'Reduce or eliminate overnight caregiving duties this evening.',
        'Ask a family member or colleague to cover the late shift.',
        'Maintain a consistent sleep schedule — same bedtime every night.',
        'Avoid screens and caffeine at least 1 hour before bed.',
      ],
      priority:        isCritical ? 'High' : 'High',
      expectedBenefit: `Reduce fatigue and restore cognitive function within 1–2 nights. Improved sleep will lower your stress score by an estimated 2–3 points and enhance emotional resilience for caregiving.`,
    });
  }

  // ── 2. EMOTIONAL BURDEN ───────────────────────────────────────────────────
  if (form.emotionalOverwhelm >= 4 && !suppressed.includes('emotional')) {
    const isExtreme = emotionalTotal >= 12;
    recs.push({
      id:           'emotional',
      category:     'Emotional Support',
      icon:         'heart-outline',
      color:        '#EF4444',
      bg:           '#FEF2F2',
      title:        isExtreme ? 'Critical Emotional Overload' : 'High Emotional Burden',
      primaryCause: 'Emotional Overload',
      reason:       `The caregiver reported an emotional overwhelm score of ${form.emotionalOverwhelm}/5, mental exhaustion of ${form.mentallyExhausted}/5, and emotional drain of ${form.emotionallyDrained}/5 — giving a combined emotional burden of ${emotionalTotal}/15. This is ${isExtreme ? 'dangerously high' : 'significantly elevated'} and is the primary driver of today's ${result.stressLevel.toLowerCase()} stress prediction. Handling ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today has compounded this burden.`,
      recommendations: [
        'Practice 5 minutes of deep breathing right now: inhale 4 counts, hold 4, exhale 6.',
        'Take a 10-minute mindfulness break — focus only on your breathing, nothing else.',
        isExtreme
          ? 'Contact a professional counsellor or mental health helpline today — this is urgent.'
          : 'Talk to a trusted colleague or friend about how you are feeling.',
        'Journal 3 things you handled well today — acknowledge your own strength.',
        'Schedule a proper decompression activity tonight: walk, music, or a warm bath.',
      ],
      priority:        isExtreme ? 'High' : 'High',
      expectedBenefit: `Reduce emotional exhaustion and lower cortisol levels within hours. Regular practice of these techniques can reduce your emotional burden score by 30–40% over one week.`,
    });
  }

  // ── 3. PENDING TASKS ──────────────────────────────────────────────────────
  if (pending > 10 && !suppressed.includes('workload-high')) {
    recs.push({
      id:           'workload-high',
      category:     'Workload Management',
      icon:         'clipboard-outline',
      color:        '#2563EB',
      bg:           '#EFF6FF',
      title:        'Critical Task Overload',
      primaryCause: 'Excessive Pending Tasks',
      reason:       `The caregiver has ${pending} tasks still pending from ${form.tasksAssigned} assigned today, achieving only a ${completionPct}% completion rate. With ${pending} unfinished tasks, the accumulated workload pressure is a major contributor to the current ${result.stressLevel.toLowerCase()} stress level. This volume of unfinished work creates cognitive overload and anxiety that persists beyond the shift.`,
      recommendations: [
        `Immediately identify the top 3 most critical tasks from the ${pending} pending — focus only on those.`,
        'Delegate non-urgent tasks to available family members or colleagues right now.',
        `Defer at least ${Math.floor(pending / 2)} of the lower-priority tasks to tomorrow with supervisor approval.`,
        'Communicate your workload situation clearly to your supervisor today.',
        'Use a simple priority matrix: list tasks as Urgent/Important vs Can Wait.',
      ],
      priority:        'High',
      expectedBenefit: `Reducing your active task load to under 5 tasks will significantly lower anxiety and improve focus, potentially reducing your stress score by 2–3 points immediately.`,
    });
  } else if (pending > 5 && pending <= 10 && !suppressed.includes('workload-moderate')) {
    recs.push({
      id:           'workload-moderate',
      category:     'Workload Management',
      icon:         'clipboard-outline',
      color:        '#2563EB',
      bg:           '#EFF6FF',
      title:        'Workload Needs Attention',
      primaryCause: 'Elevated Task Backlog',
      reason:       `The caregiver completed ${form.tasksCompleted} out of ${form.tasksAssigned} assigned tasks today (${completionPct}% completion), leaving ${pending} tasks pending. While not critical, this backlog creates ongoing stress and risks escalating if not addressed. The combination of ${form.hoursCaregiving} hours of caregiving and ${pending} unfinished tasks is unsustainable.`,
      recommendations: [
        'Review the pending tasks and rank them by urgency before leaving today.',
        `Delegate at least ${Math.ceil(pending / 2)} of the ${pending} pending tasks to a colleague.`,
        'Block the first 30 minutes of tomorrow to clear the most important pending tasks.',
        'Discuss workload distribution with your supervisor if this pattern continues.',
      ],
      priority:        'Medium',
      expectedBenefit: `Clearing the task backlog will reduce end-of-shift anxiety and improve your starting position tomorrow, lowering overall stress by an estimated 15–20%.`,
    });
  }

  // ── 4. BREAKS ─────────────────────────────────────────────────────────────
  if (form.breaksTaken === 0 && !suppressed.includes('no-breaks')) {
    recs.push({
      id:           'no-breaks',
      category:     'Time Management',
      icon:         'cafe-outline',
      color:        '#22C55E',
      bg:           '#F0FDF4',
      title:        'Zero Breaks in Entire Shift',
      primaryCause: 'No Recovery Time',
      reason:       `The caregiver took zero breaks during ${form.hoursCaregiving} hours of continuous caregiving today. Research consistently shows that performance degrades by approximately 20% every 2 hours without a break, and the risk of caregiving errors increases significantly. No breaks also means no physical or mental recovery time, which directly contributes to the ${result.stressLevel.toLowerCase()} stress level recorded today.`,
      recommendations: [
        'Take a 10–15 minute break RIGHT NOW — step completely away from your duties.',
        'During your break: go outside, sit quietly, or do gentle stretching — nothing work-related.',
        'Set a recurring phone alarm every 90–120 minutes for future break reminders.',
        'Eat something nutritious during your next break — skipping meals worsens stress.',
        'Even a 5-minute walk to a different room significantly improves mental clarity.',
      ],
      priority:        'High',
      expectedBenefit: `Taking regular breaks can restore up to 80% of your cognitive performance. A single 15-minute break now will improve your focus, reduce irritability, and lower your stress hormones measurably within the hour.`,
    });
  } else if (form.breaksTaken <= 1 && form.hoursCaregiving >= 6 && !suppressed.includes('few-breaks')) {
    recs.push({
      id:           'few-breaks',
      category:     'Time Management',
      icon:         'cafe-outline',
      color:        '#22C55E',
      bg:           '#F0FDF4',
      title:        'Insufficient Break Frequency',
      primaryCause: 'Inadequate Rest Periods',
      reason:       `The caregiver took only ${form.breaksTaken} break${form.breaksTaken === 1 ? '' : 's'} during ${form.hoursCaregiving} hours of caregiving. The recommended minimum is one break every 2 hours. With only ${form.breaksTaken} break${form.breaksTaken === 1 ? '' : 's'}, your body and mind have had insufficient time to recover from the physical and emotional demands of caregiving today.`,
      recommendations: [
        `For the remaining ${Math.max(1, form.hoursCaregiving - 6)} hours of your shift, take at least one more break immediately.`,
        'Each break should be at least 10 minutes and away from the caregiving environment.',
        'Combine breaks with hydration — drink a full glass of water each time.',
        'Plan tomorrow\'s breaks in advance: schedule them as non-negotiable appointments.',
      ],
      priority:        'Medium',
      expectedBenefit: `Increasing break frequency will restore energy levels and reduce cumulative fatigue. Caregivers who take regular breaks report 35% lower end-of-shift exhaustion scores.`,
    });
  }

  // ── 5. MOOD ───────────────────────────────────────────────────────────────
  if (form.mood <= 2 && !suppressed.includes('mood')) {
    recs.push({
      id:           'mood',
      category:     'Relaxation Activities',
      icon:         'sunny-outline',
      color:        '#EC4899',
      bg:           '#FDF2F8',
      title:        form.mood === 1 ? 'Very Low Mood — Urgent Support Needed' : 'Low Mood Detected',
      primaryCause: 'Low Mood',
      reason:       `The caregiver rated their mood at only ${form.mood}/5 today. This significantly low mood — particularly in the context of ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} and a ${result.stressLevel.toLowerCase()} stress prediction — indicates a risk of compassion fatigue. Low mood in caregivers directly impairs the quality of patient interactions and increases the likelihood of burnout if unaddressed.`,
      recommendations: [
        'Listen to your favourite calming or uplifting music for at least 10 minutes now.',
        'Step outside for a 5-minute walk — natural light and fresh air are evidence-based mood boosters.',
        'Call or message a trusted friend or family member — connection is a powerful antidote to low mood.',
        'Write down one thing — however small — that went well today. Finding positives rewires your stress response.',
        form.mood === 1
          ? 'If this low mood persists for several days, please speak to a mental health professional.'
          : 'Treat yourself to one small act of self-care this evening — you have earned it.',
      ],
      priority:        form.mood === 1 ? 'High' : 'Medium',
      expectedBenefit: `These activities can elevate mood within 20–30 minutes through natural neurotransmitter release. Addressing low mood early prevents escalation to clinical depression, which affects 1 in 3 long-term caregivers.`,
    });
  }

  // ── 6. PHYSICAL TIREDNESS ────────────────────────────────────────────────
  if (form.physicalTiredness >= 4 && !suppressed.includes('physical')) {
    const isExtreme = form.physicalTiredness === 5;
    recs.push({
      id:           'physical',
      category:     'Physical Wellbeing',
      icon:         'body-outline',
      color:        '#F97316',
      bg:           '#FFF7ED',
      title:        isExtreme ? 'Extreme Physical Exhaustion' : 'High Physical Fatigue',
      primaryCause: 'Physical Exhaustion',
      reason:       `The caregiver reported physical tiredness of ${form.physicalTiredness}/5 after ${form.hoursCaregiving} hours of caregiving. At this level of physical fatigue, the risk of caregiving errors increases by up to 40% according to healthcare research. Physical exhaustion also amplifies emotional stress — the two feed each other in a cycle that accelerates burnout.`,
      recommendations: [
        isExtreme
          ? 'Stop all non-essential physical activities immediately and inform your supervisor.'
          : 'Request a reduction in physically demanding tasks for the remainder of your shift.',
        'Drink a full glass of water now — dehydration dramatically worsens physical fatigue.',
        'Do a 3-minute seated stretch: neck rolls, shoulder shrugs, ankle rotations, wrist circles.',
        'Eat a small nutritious snack if you have not eaten recently — low blood sugar intensifies fatigue.',
        'Schedule proper rest periods into tomorrow\'s shift plan before it begins.',
      ],
      priority:        isExtreme ? 'High' : 'Medium',
      expectedBenefit: `Addressing physical fatigue now prevents compounding exhaustion. Hydration alone can reduce fatigue symptoms by 15–20% within 30 minutes. Planned rest periods will restore physical capacity for safe caregiving.`,
    });
  }

  // ── 7. DIFFICULT SITUATIONS ───────────────────────────────────────────────
  if (form.difficultSituations >= 4 && !suppressed.includes('difficult')) {
    const isSevere = form.difficultSituations >= 6;
    recs.push({
      id:           'difficult',
      category:     'Stress Management',
      icon:         'shield-outline',
      color:        '#8B5CF6',
      bg:           '#F5F3FF',
      title:        isSevere ? 'High Exposure to Trauma Events' : 'Emotional Decompression Needed',
      primaryCause: 'High Exposure to Difficult Situations',
      reason:       `The caregiver encountered ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today — including patient confusion and agitation episodes. Each of these events requires significant emotional labour and leaves a physiological stress residue. Without deliberate decompression, these accumulate into secondary traumatic stress and eventual burnout. This is one of the key factors in today's ${result.stressLevel.toLowerCase()} stress prediction.`,
      recommendations: [
        'Take a 5-minute "debrief walk" alone right now — mentally review each situation and consciously release it.',
        'Use the 4-7-8 breathing technique: inhale 4, hold 7, exhale 8 counts. Repeat 4 times.',
        isSevere
          ? 'Speak to your supervisor or a mental health professional about today\'s experiences — this level of exposure requires formal debriefing.'
          : 'Share the experience with a trusted colleague — verbalising difficult events reduces their psychological weight.',
        'Write briefly about what happened — journalling trauma events reduces their emotional impact by 30%.',
        'Remind yourself: these patient behaviours are symptoms of dementia, not personal.',
      ],
      priority:        isSevere ? 'High' : 'Medium',
      expectedBenefit: `Deliberate decompression after difficult incidents prevents accumulation of traumatic stress. Caregivers who debrief regularly report 45% lower burnout rates and sustain higher quality care over time.`,
    });
  }

  // ── 8. COUNSELLING (very high stress + emotional) ─────────────────────────
  if (
    result.stressLevel === 'High' &&
    emotionalTotal >= 11 &&
    !suppressed.includes('counselling')
  ) {
    recs.push({
      id:           'counselling',
      category:     'Professional Counselling',
      icon:         'chatbubbles-outline',
      color:        '#06B6D4',
      bg:           '#ECFEFF',
      title:        'Professional Support Recommended',
      primaryCause: 'Sustained High Stress Pattern',
      reason:       `The caregiver's combined stress indicators — ${result.stressLevel} stress level, emotional burden of ${emotionalTotal}/15, and ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} today — suggest that professional psychological support would be significantly beneficial. Self-care strategies alone may be insufficient at this stress level without professional guidance.`,
      recommendations: [
        'Schedule an appointment with a counsellor or psychologist this week — do not delay.',
        'Contact a caregiver-specific support helpline for immediate telephone support.',
        'Speak honestly with your supervisor about your current mental health state.',
        'Join a dementia caregiver support group to connect with others who understand your experience.',
        'Ask your GP about caregiver mental health support programmes available in your area.',
      ],
      priority:        'High',
      expectedBenefit: `Professional counselling has demonstrated a 60% reduction in caregiver burnout symptoms in clinical studies. Early intervention prevents escalation to clinical depression and extends your capacity to provide quality care.`,
    });
  }

  // ── 9. FAMILY SUPPORT ────────────────────────────────────────────────────
  if (
    result.stressLevel !== 'Low' &&
    pending > 5 &&
    !suppressed.includes('family')
  ) {
    recs.push({
      id:           'family',
      category:     'Family Support',
      icon:         'people-outline',
      color:        '#F59E0B',
      bg:           '#FFFBEB',
      title:        'Involve Family in Caregiving',
      primaryCause: 'Caregiver Isolation',
      reason:       `With ${pending} pending tasks and ${result.stressLevel.toLowerCase()} stress, the caregiver appears to be managing too much alone. Research shows that caregivers with active family support systems experience 40% lower burnout rates. Sharing the ${form.tasksAssigned} daily tasks across family members creates a more sustainable caregiving model.`,
      recommendations: [
        'Contact a family member today with a specific, concrete request for help — not a general "I need help."',
        'List which of the ${pending} pending tasks can be handled by non-professional family members.',
        'Schedule a family meeting this week to redistribute caregiving responsibilities fairly.',
        'Share this stress assessment with family to help them understand the urgency.',
        'Remember: asking for help is a sign of strength, not weakness.',
      ],
      priority:        'Medium',
      expectedBenefit: `Distributing caregiving responsibilities across family members can reduce your personal task load by 30–50%, directly lowering stress scores and preventing long-term burnout.`,
    });
  }

  // ── 10. HYDRATION ─────────────────────────────────────────────────────────
  if (form.hoursCaregiving >= 5 && !suppressed.includes('hydration')) {
    recs.push({
      id:           'hydration',
      category:     'Healthy Lifestyle',
      icon:         'water-outline',
      color:        '#84CC16',
      bg:           '#F7FEE7',
      title:        'Hydration & Nutrition Check',
      primaryCause: 'Dehydration Risk',
      reason:       `After ${form.hoursCaregiving} hours of active caregiving, the body loses significant fluids through physical activity and stress-related perspiration. Even mild dehydration of just 1–2% of body weight worsens fatigue by 15%, impairs concentration, and negatively affects mood — all of which compound the already ${result.stressLevel.toLowerCase()} stress state recorded today.`,
      recommendations: [
        'Drink a full glass of water (250ml) right now before doing anything else.',
        'Keep a visible water bottle at your workstation — visibility increases consumption by 3x.',
        'Aim for 8 glasses (2 litres) of water throughout the day.',
        'Eat a nutritious meal or snack within the next hour if you have not done so.',
        'Avoid excessive coffee — it dehydrates and increases anxiety at high stress levels.',
      ],
      priority:        'Low',
      expectedBenefit: `Proper hydration can reduce fatigue symptoms by 15–20% within 30 minutes and improve mood and concentration. Consistent hydration throughout caregiving shifts is one of the simplest and most effective wellbeing interventions.`,
    });
  }

  // ── 11. SUSTAINED HIGH-STRESS PATTERN (multi-day) ─────────────────────────
  if (weekly && weekly.consecutiveHigh !== undefined && weekly.consecutiveHigh >= 2 && !suppressed.includes('sustained-stress')) {
    recs.push({
      id:           'sustained-stress',
      category:     'Burnout Prevention',
      icon:         'flame-outline',
      color:        '#DC2626',
      bg:           '#FEF2F2',
      title:        `${weekly.consecutiveHigh} Consecutive High-Stress Days`,
      primaryCause: 'Sustained Weekly Stress Pattern',
      reason:       `This is your ${weekly.consecutiveHigh} day in a row with high stress readings, with a burnout risk score of ${weekly.riskScore}/100 (${weekly.riskLevel}). A single hard day is normal caregiving — but ${weekly.consecutiveHigh} in a row is a pattern, not an exception, and today's individual check-in should be read in that context rather than in isolation.`,
      recommendations: [
        'Treat this as a multi-day pattern, not a single bad day — one night of good sleep will not fully resolve it.',
        'Book a lighter shift or a rest day within the next 48 hours if at all possible.',
        'Tell your supervisor specifically about the multi-day pattern, not just today\'s workload.',
        'Ask a family member or colleague to fully cover at least one shift this week.',
        weekly.riskLevel === 'High'
          ? 'Speak to a counsellor or mental health professional this week — sustained high stress compounds faster than single-day stress.'
          : 'Keep monitoring daily — if a 3rd consecutive high day occurs, treat it as urgent.',
      ],
      priority:        'High',
      expectedBenefit: `Caregivers with 3+ consecutive high-stress days who don't intervene are significantly more likely to progress to clinical burnout. Breaking the pattern now — even with one lighter day — meaningfully lowers that risk compared to waiting.`,
    });
  }

  // ── 12. WEEKLY TREND WORSENING (early warning, before it becomes severe) ──
  if (weekly && weekly.trend === 'worsening' && weekly.daysAnalyzed >= 3 && (weekly.consecutiveHigh ?? 0) < 2 && !suppressed.includes('trend-worsening')) {
    recs.push({
      id:           'trend-worsening',
      category:     'Burnout Prevention',
      icon:         'trending-up-outline',
      color:        '#F97316',
      bg:           '#FFF7ED',
      title:        'Your Stress Has Been Climbing',
      primaryCause: 'Worsening Weekly Trend',
      reason:       `Looking at your last ${weekly.daysAnalyzed} check-ins, your average stress score is ${(weekly.avgStressScore ?? 0).toFixed(1)}/10 and trending upward — even though today's ${result.stressLevel} reading may not look critical on its own. Catching a rising trend early is far more effective than waiting until it becomes a high-stress emergency.`,
      recommendations: [
        'Think back over the last few days — a new task, less sleep, fewer breaks — and address that specific cause directly.',
        'Proactively schedule one lighter day this week before stress escalates further.',
        'Check in with yourself a second time later today, not just once, to catch rising stress earlier.',
        'Share the trend (not just today\'s score) with someone you trust — patterns are easier to act on together than single days.',
      ],
      priority:        'Medium',
      expectedBenefit: `Addressing a rising trend early typically prevents escalation to high burnout risk, and requires far less recovery time than intervening only once stress has already peaked.`,
    });
  }

  // ── 13. CHRONIC SLEEP DEBT (masked by one good night) ──────────────────────
  if (weekly && weekly.avgSleep !== undefined && weekly.avgSleep < 6 && form.sleepHours >= 6 && !suppressed.includes('chronic-sleep')) {
    recs.push({
      id:           'chronic-sleep',
      category:     'Sleep Management',
      icon:         'moon-outline',
      color:        '#6366F1',
      bg:           '#EEF2FF',
      title:        'Weekly Sleep Debt Still Present',
      primaryCause: 'Cumulative Sleep Deficit',
      reason:       `You slept ${form.sleepHours} hours last night — good on its own — but your average over the last ${weekly.daysAnalyzed} check-ins is only ${weekly.avgSleep.toFixed(1)} hours, still below the 6-hour threshold. One good night does not clear an accumulated sleep debt; recovery typically needs several consecutive nights of adequate sleep.`,
      recommendations: [
        'Aim for 7–8 hours for at least 3 consecutive nights this week to start repaying the debt, not just tonight.',
        'Avoid trying to "catch up" with one very long sleep — consistency matters more than a single long night.',
        'If poor sleep keeps recurring, write down what is interrupting it (caregiving duties, worry, environment) and address that specific cause.',
      ],
      priority:        'Medium',
      expectedBenefit: `Fully recovering from a week of sleep debt usually takes 3–4 nights of consistent, adequate sleep. Tracking the weekly pattern — not just single nights — is what actually reduces cumulative fatigue and stress.`,
    });
  }

  // ── 14. POSITIVE REINFORCEMENT (improving trend) ───────────────────────────
  if (weekly && weekly.trend === 'improving' && weekly.daysAnalyzed >= 3 && !suppressed.includes('trend-improving')) {
    recs.push({
      id:           'trend-improving',
      category:     'Positive Progress',
      icon:         'ribbon-outline',
      color:        '#22C55E',
      bg:           '#F0FDF4',
      title:        'Your Stress Trend Is Improving',
      primaryCause: 'Positive Weekly Trend',
      reason:       `Over your last ${weekly.daysAnalyzed} check-ins, your stress trend is moving in the right direction and your burnout risk is now ${weekly.riskLevel}. Whatever you've changed recently — more breaks, better sleep, delegating tasks — appears to be working.`,
      recommendations: [
        'Note down what changed recently so you can deliberately repeat it.',
        'Don\'t drop the habits that are working just because you\'re feeling better today.',
        'Use today\'s lower stress to get ahead on something, so a busier day later this week is easier to absorb.',
      ],
      priority:        'Low',
      expectedBenefit: `Reinforcing a positive pattern early makes it more likely to stick long-term, and builds resilience against future high-stress days.`,
    });
  }

  // ── 15. OVERALL HIGH STRESS SIGNAL (model says High, no single factor explains it) ──
  // Covers the gap where the ML model classifies High from a *combination* of
  // moderately-elevated factors, but no individual rule above was extreme
  // enough to fire strongly (the counselling rule needs emotionalTotal >= 11).
  if (result.stressLevel === 'High' && emotionalTotal < 11 && !suppressed.includes('overall-high')) {
    recs.push({
      id:           'overall-high',
      category:     'Burnout Prevention',
      icon:         'warning-outline',
      color:        '#EF4444',
      bg:           '#FEF2F2',
      title:        'Today Was Rated High Stress Overall',
      primaryCause: 'Combined Daily Load',
      reason:       `Individually, none of today's answers looked extreme, but the model classified today as High stress (score ${result.stressScore}/10, ${Math.round(result.confidence * 100)}% confidence). This happens when several moderate factors — ${form.hoursCaregiving} hours of caregiving, ${pending} pending task${pending !== 1 ? 's' : ''}, and ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''} — combine rather than any single cause standing out. Small stressors stack up even when no one factor crosses an obvious line.`,
      recommendations: [
        'Don\'t dismiss this because no single thing feels "bad enough" — the combination is the issue today.',
        'Pick the one factor above that\'s easiest to change right now and address just that one.',
        'Keep tomorrow\'s check-in honest — a repeat High day with the same pattern is worth flagging to someone.',
      ],
      priority:        'High',
      expectedBenefit: `Catching a "quietly High" day — one without an obvious single cause — before it repeats is exactly what prevents gradual, hard-to-notice burnout.`,
    });
  }

  // ── 16. LOW STRESS TODAY — positive reinforcement (mirrors weekly rule 14, but for today) ──
  if (result.stressLevel === 'Low' && !suppressed.includes('today-low')) {
    recs.push({
      id:           'today-low',
      category:     'Positive Progress',
      icon:         'happy-outline',
      color:        '#22C55E',
      bg:           '#F0FDF4',
      title:        'Low Stress Day — Keep This Rhythm',
      primaryCause: 'Well-Balanced Day',
      reason:       `Today's check-in came back Low stress (score ${result.stressScore}/10) with ${form.breaksTaken} break${form.breaksTaken !== 1 ? 's' : ''} taken and ${completionPct}% of tasks completed. Whatever balance you struck today between workload, rest, and recovery is worth noticing and repeating.`,
      recommendations: [
        'Notice what made today easier — the same routine tomorrow is a reasonable goal.',
        'Use today\'s lower load to catch up on anything you\'ve been putting off.',
        'A good day doesn\'t need to be undone by overcommitting tomorrow — pace stays worth protecting.',
      ],
      priority:        'Low',
      expectedBenefit: `Recognising what a good day looked like makes it easier to recreate deliberately, rather than by chance.`,
    });
  }

  // ── Today's own High classification escalates medium-priority items ────────
  if (result.stressLevel === 'High') {
    recs.forEach((r) => {
      if (r.priority === 'Medium') r.priority = 'High';
    });
  }

  // ── Weekly risk escalates today's medium-priority items ────────────────────
  if (weekly && weekly.riskLevel === 'High') {
    recs.forEach((r) => {
      if (r.priority === 'Medium') r.priority = 'High';
    });
  }

  // ── Sort: priority order, then boost ──────────────────────────────────────
  const ORDER = { High: 0, Medium: 1, Low: 2 };
  recs.sort((a, b) => {
    const aBoost = boosted.includes(a.id) ? -1 : 0;
    const bBoost = boosted.includes(b.id) ? -1 : 0;
    if (aBoost !== bBoost) return aBoost - bBoost;
    return ORDER[a.priority] - ORDER[b.priority];
  });

  return recs.slice(0, 7); // was 5, then 6 — bumped again so stress-level cards aren't crowded out
};

// ── Summary message ────────────────────────────────────────────────────────
export const getSummaryMessage = (
  form:   DailyCheckIn,
  result: CheckInResult,
): string => {
  const rate    = Math.round((form.tasksCompleted / Math.max(form.tasksAssigned, 1)) * 100);
  const pending = form.tasksAssigned - form.tasksCompleted;

  if (result.stressLevel === 'High') {
    return `You completed ${rate}% of tasks (${form.tasksCompleted}/${form.tasksAssigned}) despite a tough day with ${form.difficultSituations} difficult situation${form.difficultSituations !== 1 ? 's' : ''}. Here is what will help most right now:`;
  } else if (result.stressLevel === 'Moderate') {
    return `You are managing well with ${rate}% task completion and ${form.breaksTaken} break${form.breaksTaken !== 1 ? 's' : ''} taken. A few targeted actions can help you finish the day stronger:`;
  }
  return `Excellent work today — ${rate}% task completion with low stress. Here are tips to maintain this positive balance:`;
};