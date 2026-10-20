// ─────────────────────────────────────────────────────────────────────────
//  Decision engine — rules, not AI. Pure functions only: everything a
//  SessionOutcome needs to compute `decision` and, later, `followUp`.
//  Thresholds are gathered here in one place so they're easy to explain
//  and adjust without hunting through controllers.
// ─────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // same real scale as the already-live ALERT_THRESHOLD in emotionController.js
  // (confirmed: a real 32-point happy-confidence swing only produced
  // moodLift -0.64) — reusing it so "good mood" and "alert-worthy" mean
  // the same bar instead of two arbitrary numbers.
  MOOD_GOOD_MIN: 0.5,

  // quiz is always exactly 3 questions (confirmed this session) — 0.6
  // means "2 of 3 correct or better is good".
  RECALL_GOOD_MIN: 0.6,

  // deliberately 2, not a higher "safer-looking" number — both real
  // sessions in the dev DB today have exactly 2 EmotionLog readings. A
  // stricter minimum would make not_enough_data the permanent, universal
  // outcome. Matches the threshold already established this session (the
  // mood-shift windowing fix treats <6 readings as single-frame compare).
  MIN_FRAMES_USED: 2,

  FOLLOWUP_WINDOW_DAYS: 14,

  // a real-but-smaller shift than MOOD_GOOD_MIN, on the same verified scale
  // (roughly 60% of it) — "better" shouldn't require as big a swing as
  // "good" does from a standing start.
  FOLLOWUP_MOOD_DELTA: 0.3,
};

const SUGGESTED_ACTIONS = {
  strong_happy: ['send_similar_story', 'share_with_family'],
  comforting_fading: ['call_or_visit', 'show_photo_together'],
  clear_painful: ['pause_topic', 'try_gentler_story'],
  confusing_upsetting: ['call_now', 'pause_topic'],
  not_enough_data: ['call_or_visit', 'dismiss'],
};

const TITLES = {
  strong_happy: 'Strong, happy memory',
  comforting_fading: 'Comforting but fading',
  clear_painful: 'Clear but painful memory',
  confusing_upsetting: 'Confusing or upsetting',
  not_enough_data: 'Not enough information',
};

const TEXTS = {
  strong_happy: 'This story seemed to lift her mood, and she remembered the details well.',
  comforting_fading: 'This story seemed to make her feel good, even though the details were harder to recall.',
  clear_painful: 'She remembered the details clearly, but the story seemed to bring up some sadness.',
  confusing_upsetting: 'This story seemed to confuse or upset her, and the details did not come back easily.',
  not_enough_data: "There wasn't quite enough information this time to understand how the story went.",
};

const GENERIC_TIPS = {
  strong_happy: 'Ask her to tell you more about this memory — she seems to hold on to it well.',
  comforting_fading: 'Show her the photo again before you ask questions — it may help the details come back.',
  clear_painful: 'Let her lead the conversation. There is no need to ask follow-up questions about this one.',
  confusing_upsetting: 'Keep the visit calm and simple. This memory may not be the easiest to revisit right now.',
  not_enough_data: 'There is not enough detail yet to suggest a specific tip for this memory.',
};

// "happy"/"calm" read as a positive reaction, "sad" as negative — matches
// EmojiReaction's enum in family.types.ts
const reactionValence = (reaction) => {
  if (!reaction) return null;
  return reaction === 'sad' ? 'negative' : 'positive';
};

// builds the one-line "what to say next time" tip from real quiz detail
// when it exists, falling back to a safe generic tip per decision code
const buildTalkAboutTip = (code, quizDetail) => {
  if (!quizDetail || !Array.isArray(quizDetail.questions) || quizDetail.questions.length === 0) {
    return GENERIC_TIPS[code];
  }

  const missed = quizDetail.questions.find((q) => q.isCorrect === false);
  const remembered = quizDetail.questions.find((q) => q.isCorrect === true);

  // strip the "Do you remember ...?" wrapper down to the bare topic, e.g.
  // "Do you remember where this happened?" -> "where this happened"
  const topicOf = (questionText) =>
    (questionText || '').replace(/^do you remember\s*/i, '').replace(/\?$/, '').trim();

  if (missed) {
    const hint = missed.sourceSnippet ? ` Try mentioning: "${missed.sourceSnippet}".` : '';
    return `She did not remember ${topicOf(missed.questionText)}.${hint}`;
  }
  if (remembered) {
    return `She remembered ${topicOf(remembered.questionText)} — ask her to tell you more about it.`;
  }
  return GENERIC_TIPS[code];
};

/**
 * @param {object} input
 * @param {number} input.moodLift - real moodLift scale (see CONFIG comment)
 * @param {number} input.framesUsed - EmotionLog readings actually used
 * @param {number|null} [input.framesTotal] - expected frame count, if known
 * @param {number|null} input.recallScore - 0 to 1, or null if no completed quiz yet
 * @param {object|null} [input.quizDetail] - { questions: [{questionText, isCorrect, sourceSnippet}] } for the talk-about tip
 * @param {'happy'|'calm'|'sad'|null} [input.reaction] - patient's own reaction, if captured
 * @param {string} [input.category]
 */
const computeDecision = (input) => {
  const {
    moodLift,
    framesUsed,
    framesTotal = null,
    recallScore,
    quizDetail = null,
    reaction = null,
    category = null,
  } = input;

  const hasEnoughMoodData = typeof moodLift === 'number' && framesUsed >= CONFIG.MIN_FRAMES_USED;
  const hasRecall = typeof recallScore === 'number';

  let code;
  if (!hasEnoughMoodData || !hasRecall) {
    code = 'not_enough_data';
  } else {
    const moodGood = moodLift >= CONFIG.MOOD_GOOD_MIN;
    const recallGood = recallScore >= CONFIG.RECALL_GOOD_MIN;
    code = moodGood
      ? (recallGood ? 'strong_happy' : 'comforting_fading')
      : (recallGood ? 'clear_painful' : 'confusing_upsetting');
  }

  // confidence — only meaningful once we actually have both mood and
  // recall (not_enough_data is its own honest, low-confidence-by-definition state)
  let confidence = 'low';
  let reactionNote = '';
  if (code !== 'not_enough_data') {
    const moodVal = moodLift >= CONFIG.MOOD_GOOD_MIN ? 'positive' : 'negative';
    const recallVal = recallScore >= CONFIG.RECALL_GOOD_MIN ? 'positive' : 'negative';
    const reactVal = reactionValence(reaction);

    if (reactVal === null) {
      // one of three signals missing — brief: "medium ... or one is missing"
      confidence = 'medium';
    } else if (moodVal === recallVal && recallVal === reactVal) {
      confidence = 'high'; // all three agree
    } else if (reactVal !== moodVal) {
      // the patient's own reaction disagrees with the face signal —
      // explicitly called out in the brief as a low-confidence case
      confidence = 'low';
      reactionNote = ' Her own reaction suggested something different — worth checking in.';
    } else {
      confidence = 'medium'; // mood & reaction agree, recall is the outlier
    }
  } else {
    confidence = 'low';
  }

  return {
    code,
    title: TITLES[code],
    text: TEXTS[code] + reactionNote,
    confidence,
    talkAboutTip: buildTalkAboutTip(code, quizDetail),
    quality: { framesUsed, framesTotal },
    inputs: { moodLift, framesUsed, framesTotal, recallScore, reaction, category },
    suggestedActions: SUGGESTED_ACTIONS[code],
    computedAt: new Date(),
  };
};

/**
 * Stage 6 — compares an earlier acted-on session against the next
 * completed session for the same patient. Pure: takes plain numbers in,
 * returns a plain result. The caller decides whether the new session even
 * qualifies as a follow-up (window, pending status, etc).
 *
 * @param {object} args
 * @param {number} args.oldMoodLift
 * @param {number|null} args.oldRecallScore
 * @param {number} args.newMoodLift
 * @param {number|null} args.newRecallScore
 * @param {string} args.newCode - the new session's decision code
 * @returns {{outcome: 'better'|'same'|'worse', moodDelta: number, recallDelta: number|null}|null}
 *          null means "do not evaluate yet" (new session itself has no real signal)
 */
const evaluateFollowUp = ({ oldMoodLift, oldRecallScore, newMoodLift, newRecallScore, newCode }) => {
  if (newCode === 'not_enough_data') return null;

  const moodDelta = Math.round((newMoodLift - oldMoodLift) * 100) / 100;
  const recallDelta =
    typeof oldRecallScore === 'number' && typeof newRecallScore === 'number'
      ? Math.round((newRecallScore - oldRecallScore) * 100) / 100
      : null;

  let outcome;
  if (moodDelta >= CONFIG.FOLLOWUP_MOOD_DELTA) {
    outcome = 'better';
  } else if (recallDelta !== null && recallDelta > 0 && moodDelta > -CONFIG.FOLLOWUP_MOOD_DELTA) {
    outcome = 'better'; // recall improved and mood did not get worse
  } else if (moodDelta <= -CONFIG.FOLLOWUP_MOOD_DELTA) {
    outcome = 'worse';
  } else {
    outcome = 'same';
  }

  return { outcome, moodDelta, recallDelta };
};

module.exports = { CONFIG, computeDecision, evaluateFollowUp };
