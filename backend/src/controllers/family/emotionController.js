const EmotionLog = require('../../models/family/EmotionLog');
const SessionOutcome = require('../../models/family/SessionOutcome');
const StoryQuizAttempt = require('../../models/family/StoryQuizAttempt');
const FamilyMemory = require('../../models/family/FamilyMemory');
const PatientTopicPreference = require('../../models/family/PatientTopicPreference');
const { classifyEmotion, ensureReady } = require('../../services/emotion/faceEmotionDetector');
const { computeDecision } = require('../../services/family/decisionEngine');
const { expirePendingFollowUps, runFollowUpScan } = require('../../services/family/followUpScanner');

const VALID_REACTIONS = ['happy', 'calm', 'sad'];

// Local, self-hosted classifier (see services/emotion/faceEmotionDetector.js)
// — replaced the Hugging Face hosted model after it started requiring paid
// credits for every call. Its labels still match EmotionLog's enum
// (happy/sad/angry/surprise/fear/disgust/neutral).
const EMOTION_KEYS = ['happy', 'sad', 'angry', 'surprise', 'fear', 'disgust', 'neutral'];

// valence weights — Option 2, confidence-weighted scoring
const VALENCE_WEIGHTS = {
    happy: 2,
    surprise: 1,
    neutral: 0,
    sad: -1,
    fear: -1,
    disgust: -1,
    angry: -2,
};

// calculates a single reading's positivity score from its 
// full confidence breakdown (0-100 scale per emotion)
function calculatePositivity(emotionScores) {
    let score = 0;
    for (const [emotion, weight] of Object.entries(VALENCE_WEIGHTS)) {
        const confidence = emotionScores[emotion] || 0;
        score += (confidence / 100) * weight;
    }
    return score;
}

// --- WARMUP — loads the local model into memory before real-time captures
//     start (first load does real file I/O + graph construction; after
//     that, classifyEmotion calls are fast). Fire-and-forget. ---
const warmupEmotionService = (req, res) => {
    ensureReady().catch(() => {
        // don't care about the result here — just want it loaded
    });
    res.status(202).json({ success: true, message: 'Warmup ping sent' });
};

// --- CAPTURE — receives a photo from the app, forwards to
//     the deployed emotion detection service, logs the result ---
const captureEmotion = async (req, res) => {
    try {
        const {
            memoryId,
            sessionId,
            secondsIntoPlayback,
            photoBase64,
        } = req.body;
        const patientId = req.linkedPatientId;

        if (!memoryId || !sessionId || !photoBase64) {
            return res.status(400).json({
                success: false,
                message: 'memoryId, sessionId and photoBase64 are required',
            });
        }

        const buffer = Buffer.from(photoBase64, 'base64');
        console.log(`[emotion] captured frame: ${buffer.length} bytes, session ${sessionId}, t=${secondsIntoPlayback}s`);

        let predictions;
        try {
            predictions = await classifyEmotion(buffer);
        } catch (detectionError) {
            if (detectionError.noFaceDetected) {
                // expected/normal — patient looked away, poor lighting, etc.
                // Not an error worth logging as a failure or a 500: there's
                // just nothing to record for this one tick.
                return res.status(200).json({ success: true, skipped: true, message: 'No face detected in frame' });
            }
            console.error('[emotion] local classification failed:', detectionError.message);
            throw detectionError;
        }

        // predictions: [{ label: 'happy', score: 0.83 }, ...] — build the
        // 0-100 scale breakdown the rest of the app expects, defaulting any
        // class HF didn't return to 0
        const emotionScores = Object.fromEntries(EMOTION_KEYS.map((k) => [k, 0]));
        let dominantEmotion = EMOTION_KEYS[0];
        let topScore = -1;
        for (const { label, score } of predictions) {
            const key = label.toLowerCase();
            if (!(key in emotionScores)) continue;
            emotionScores[key] = Math.round(score * 10000) / 100; // 0-1 -> 0-100
            if (score > topScore) {
                topScore = score;
                dominantEmotion = key;
            }
        }

        const log = await EmotionLog.create({
            patientId,
            memoryId,
            sessionId,
            secondsIntoPlayback: secondsIntoPlayback || 0,
            dominantEmotion,
            emotionScores,
        });

        res.status(201).json({ success: true, log });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- LOG a single emotion reading directly (kept for manual/testing use) ---
const logEmotionReading = async (req, res) => {
    try {
        const {
            memoryId,
            sessionId,
            secondsIntoPlayback,
            dominantEmotion,
            emotionScores,
        } = req.body;
        const patientId = req.linkedPatientId;

        if (!memoryId || !sessionId || !dominantEmotion) {
            return res.status(400).json({
                success: false,
                message: 'memoryId, sessionId and dominantEmotion are required',
            });
        }

        const log = await EmotionLog.create({
            patientId,
            memoryId,
            sessionId,
            secondsIntoPlayback: secondsIntoPlayback || 0,
            dominantEmotion,
            emotionScores: emotionScores || {},
        });

        res.status(201).json({ success: true, log });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- FINALIZE a session — calculate moodLift, save SessionOutcome ---
const finalizeSession = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required',
            });
        }

        const readings = await EmotionLog.find({ sessionId }).sort({
            secondsIntoPlayback: 1,
        });

        if (readings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No emotion readings found for this session',
            });
        }

        // groups-of-3 only gives a real baseline-vs-final signal once there
        // are enough readings for the two windows to be genuinely separate
        // (6+) — below that, slice(0, min(3,N)) and slice(-min(3,N)) overlap
        // partially or completely (at N<=3 they're identical), silently
        // forcing moodShiftPercent to 0 regardless of any real change.
        // Confirmed against real session data: a 2-reading session showed a
        // real 32-point swing in raw happy-confidence between its two
        // frames, but reported 0% shift under the old windowing. Below 6
        // readings, compare the single earliest reading to the single
        // latest one instead — always a real signal, never a forced zero.
        const windowSize = readings.length < 6 ? 1 : 3;
        const firstReadings = readings.slice(0, windowSize);
        const lastReadings = readings.slice(-windowSize);

        const avgPositivity = (readingSet) => {
            const scores = readingSet.map((r) => calculatePositivity(r.emotionScores));
            return scores.reduce((sum, s) => sum + s, 0) / scores.length;
        };

        // real 0-100 confidence percentages for one emotion, averaged across
        // a set of readings — what the family dashboard actually displays
        const avgEmotionPercent = (readingSet, emotion) => {
            const scores = readingSet.map((r) => r.emotionScores[emotion] || 0);
            return Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
        };

        const baselinePositivity = avgPositivity(firstReadings);
        const finalPositivity = avgPositivity(lastReadings);
        const moodLift = finalPositivity - baselinePositivity;

        const sadBeforePercent = avgEmotionPercent(firstReadings, 'sad');
        const happyBeforePercent = avgEmotionPercent(firstReadings, 'happy');
        const happyAfterPercent = avgEmotionPercent(lastReadings, 'happy');
        const moodShiftPercent = Math.round((happyAfterPercent - happyBeforePercent) * 10) / 10;

        // find the single most positive reading across the whole session
        let peakReading = readings[0];
        let peakScore = calculatePositivity(readings[0].emotionScores);
        for (const r of readings) {
            const s = calculatePositivity(r.emotionScores);
            if (s > peakScore) {
                peakScore = s;
                peakReading = r;
            }
        }

        // lowered from 1.0 — that bar was too strict to ever catch a modest
        // real lift (confirmed: a real 32-point happy-confidence swing only
        // produced moodLift -0.64, nowhere close to 1.0). 0.5 is a middle
        // ground: low enough for a genuine modest improvement to register,
        // but still above the jitter a single noisy frame can introduce now
        // that short sessions compare single frames instead of averaged
        // groups of 3 (see finalizeSession's windowSize comment above).
        // Still just an estimate — worth tuning after more real sessions.
        const ALERT_THRESHOLD = 0.5;
        const alertTriggered = moodLift >= ALERT_THRESHOLD;

        // whichever dominant emotion showed up most often across the whole
        // session — "what was she mostly feeling", not just start/end
        const emotionCounts = {};
        for (const r of readings) {
            emotionCounts[r.dominantEmotion] = (emotionCounts[r.dominantEmotion] || 0) + 1;
        }
        const mostFrequentEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const roundedMoodLift = Math.round(moodLift * 100) / 100;

        // Decide (stage 3), hook #1 — mood is known now, recall is not (the
        // quiz is requested by the frontend only after this call returns,
        // and can take 30s-250s+ or never complete). recallScore: null
        // means computeDecision will honestly land on not_enough_data here;
        // it's recomputed with real recall in storyQuizController.js once
        // that story's quiz attempt completes.
        const memory = await FamilyMemory.findById(readings[0].memoryId).select('category');
        const decision = computeDecision({
            moodLift: roundedMoodLift,
            framesUsed: readings.length,
            recallScore: null,
            reaction: null, // not yet captured for story-listening sessions — see PatientTopicPreference/decisionEngine notes
            category: memory ? memory.category : null,
        });

        const outcome = await SessionOutcome.findOneAndUpdate(
            { sessionId },
            {
                patientId: readings[0].patientId,
                memoryId: readings[0].memoryId,
                sessionId,
                baselineEmotion: firstReadings[0].dominantEmotion,
                peakEmotion: peakReading.dominantEmotion,
                finalEmotion: lastReadings[lastReadings.length - 1].dominantEmotion,
                mostFrequentEmotion,
                moodLift: roundedMoodLift,
                totalReadings: readings.length,
                alertTriggered,
                sadBeforePercent,
                happyBeforePercent,
                happyAfterPercent,
                moodShiftPercent,
                playbackDurationSeconds:
                    readings[readings.length - 1].secondsIntoPlayback,
                decision,
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- ACKNOWLEDGE an alert — marks a session outcome as handled so it
//     stops showing as the active "Predictive Engagement" alert ---
const acknowledgeAlert = async (req, res) => {
    try {
        const existing = await SessionOutcome.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Outcome not found',
            });
        }
        if (existing.patientId.toString() !== req.linkedPatientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this outcome',
            });
        }

        const outcome = await SessionOutcome.findByIdAndUpdate(
            req.params.id,
            { acknowledged: true },
            { new: true }
        );

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- RECORD ACTION — family tapped "Call Now" on an alert. Also
//     acknowledges it, since acting on an alert is a stronger signal than a
//     plain dismiss and the family shouldn't see the same card twice ---
const recordAction = async (req, res) => {
    try {
        const existing = await SessionOutcome.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Outcome not found',
            });
        }
        if (existing.patientId.toString() !== req.linkedPatientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this outcome',
            });
        }

        const outcome = await SessionOutcome.findByIdAndUpdate(
            req.params.id,
            { actedAt: new Date(), acknowledged: true },
            { new: true }
        );

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Act (stage 4) / Log (stage 5) — every action a family member can take on
// a Family Action Card. Every action is only a suggestion; nothing happens
// to the patient automatically (no push, no auto-messages).
const ACTION_TYPES = [
    'send_similar_story', 'share_with_family', 'call_or_visit',
    'show_photo_together', 'pause_topic', 'try_gentler_story',
    'call_now', 'dismiss',
];
const ACTION_DEDUP_WINDOW_MS = 5000;

// --- LOG an action taken on a session's card, and apply its effect ---
const logAction = async (req, res) => {
    try {
        const { type } = req.body;
        if (!ACTION_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: 'Unknown action type' });
        }

        const outcome = await SessionOutcome.findById(req.params.id);
        if (!outcome) {
            return res.status(404).json({ success: false, message: 'Outcome not found' });
        }
        if (outcome.patientId.toString() !== req.linkedPatientId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this outcome' });
        }

        const now = new Date();

        // repeated taps of the same action within a few seconds (double-tap,
        // slow network retry) must not create duplicate log entries
        const recentSame = outcome.actions.find(
            (a) => a.type === type && (now - a.takenAt) < ACTION_DEDUP_WINDOW_MS
        );
        if (recentSame) {
            return res.status(200).json({ success: true, outcome, deduped: true });
        }

        const responseSeconds = outcome.decision && outcome.decision.computedAt
            ? Math.round((now - outcome.decision.computedAt) / 1000)
            : null;

        outcome.actions.push({ type, takenAt: now, takenBy: req.user.userId, responseSeconds });
        if (!outcome.firstActedAt) {
            outcome.firstActedAt = now;
            // Check (stage 6) only ever considers a session once it has
            // been acted on — this is where it becomes eligible
            if (outcome.decision && outcome.decision.code !== 'not_enough_data') {
                outcome.followUp.status = 'pending';
            }
        }

        // effects — see brief section 3.3
        if (type === 'pause_topic') {
            const memory = await FamilyMemory.findById(outcome.memoryId).select('category');
            if (memory) {
                await PatientTopicPreference.findOneAndUpdate(
                    { patientId: outcome.patientId, category: memory.category },
                    { status: 'sensitive', setBy: req.user.userId, setAt: now },
                    { upsert: true }
                );
            }
        } else if (type === 'share_with_family') {
            outcome.sharedAt = now;
        } else if (type === 'call_now') {
            // log first, then acknowledge — the app never claims a call was
            // placed, it only opens the phone dialer client-side if a
            // number exists (none do today — see decisionEngine notes)
            outcome.acknowledged = true;
            outcome.actedAt = now; // keep the legacy alert-flow field in sync
        } else if (type === 'dismiss') {
            outcome.acknowledged = true;
        }
        // send_similar_story / call_or_visit / show_photo_together /
        // try_gentler_story have no server-side effect beyond the log —
        // their "effect" is purely what the frontend does next (open the
        // story form prefilled, show the talk-about tip, show a static
        // guide, or call the now-sensitive-aware category recommendation)

        await outcome.save();

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- REACTION — the patient's own happy/calm/sad tap right after a story,
//     feeding the one decision-engine input that's otherwise always null
//     for story sessions (see decisionEngine.js's reactionValence/confidence
//     rules, which were already built to use this and never received it) ---
const submitReaction = async (req, res) => {
    try {
        const { reaction } = req.body;
        if (!VALID_REACTIONS.includes(reaction)) {
            return res.status(400).json({ success: false, message: 'Invalid reaction value' });
        }

        const outcome = await SessionOutcome.findById(req.params.id);
        if (!outcome) {
            return res.status(404).json({ success: false, message: 'Outcome not found' });
        }
        if (outcome.patientId.toString() !== req.linkedPatientId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this outcome' });
        }

        // usually runs before the quiz completes (recallScore still null,
        // quizDetail was never persisted past its original talk-about-tip
        // use) — if a quiz already completed first, talkAboutTip falls back
        // to the generic tip for this one recompute rather than losing the
        // specific missed-question detail; the quiz's own completion always
        // recomputes again right after with full detail either way
        const priorInputs = outcome.decision && outcome.decision.inputs ? outcome.decision.inputs : {};
        outcome.decision = computeDecision({
            moodLift: outcome.moodLift,
            framesUsed: priorInputs.framesUsed,
            framesTotal: priorInputs.framesTotal,
            recallScore: priorInputs.recallScore ?? null,
            reaction,
            category: priorInputs.category,
        });
        await outcome.save();

        await runFollowUpScan(outcome);

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- RECORD FOLLOW-UP — family reports how the call actually went ---
const recordFollowUp = async (req, res) => {
    try {
        const { followUpOutcome } = req.body;

        if (!['positive', 'neutral', 'difficult'].includes(followUpOutcome)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid followUpOutcome value',
            });
        }

        const existing = await SessionOutcome.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Outcome not found',
            });
        }
        if (existing.patientId.toString() !== req.linkedPatientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this outcome',
            });
        }

        const outcome = await SessionOutcome.findByIdAndUpdate(
            req.params.id,
            { followUpOutcome },
            { new: true }
        );

        res.status(200).json({ success: true, outcome });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- GET engagement stats — did families act on alerts, and did it help ---
const getEngagementStats = async (req, res) => {
    try {
        const patientId = req.linkedPatientId;
        const outcomes = await SessionOutcome.find({ patientId, alertTriggered: true });

        const totalAlerts = outcomes.length;
        const actedOn = outcomes.filter((o) => o.actedAt).length;
        const withFollowUp = outcomes.filter((o) => o.followUpOutcome);
        const positive = withFollowUp.filter((o) => o.followUpOutcome === 'positive').length;

        const avgResponseMs = outcomes
            .filter((o) => o.actedAt)
            .reduce((sum, o) => sum + (new Date(o.actedAt) - new Date(o.createdAt)), 0) / (actedOn || 1);

        res.status(200).json({
            success: true,
            stats: {
                totalAlerts,
                actedOn,
                responseRate: totalAlerts ? Math.round((actedOn / totalAlerts) * 100) : 0,
                avgResponseMinutes: actedOn ? Math.round(avgResponseMs / 60000) : null,
                followUpsLogged: withFollowUp.length,
                positiveOutcomeRate: withFollowUp.length
                    ? Math.round((positive / withFollowUp.length) * 100)
                    : null,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- GET all outcomes for a patient (for reporting/dashboard later) ---
const getPatientOutcomes = async (req, res) => {
    try {
        const patientId = req.linkedPatientId;
        await expirePendingFollowUps(patientId);

        const outcomes = await SessionOutcome.find({ patientId })
            .populate('memoryId', 'photoUrl generatedStory familyNote category')
            .sort({ createdAt: -1 });

        // attach each session's quiz result (if any) — one batched query
        // instead of one per outcome. Most sessions will have no attempt
        // (AI-unavailable fallback is to skip the quiz, not create one).
        const attempts = await StoryQuizAttempt.find({
            sessionId: { $in: outcomes.map((o) => o.sessionId) },
        });
        const attemptBySessionId = Object.fromEntries(attempts.map((a) => [a.sessionId, a]));

        const outcomesWithQuiz = outcomes.map((o) => {
            const attempt = attemptBySessionId[o.sessionId];
            return {
                ...o.toObject(),
                quiz: attempt
                    ? {
                        attemptId: attempt._id,
                        score: attempt.score,
                        totalQuestions: attempt.questions.length,
                        status: attempt.status,
                        seenByFamilyAt: attempt.seenByFamilyAt,
                        questions: attempt.questions.map((q) => ({
                            questionText: q.questionText,
                            isCorrect: q.isCorrect,
                        })),
                    }
                    : null,
            };
        });

        res.status(200).json({ success: true, outcomes: outcomesWithQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const median = (numbers) => {
    if (numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
};

const MIN_SESSIONS_FOR_LOOP_HEALTH = 3;

// --- GET Loop Health stats — the close-the-loop dashboard panel:
//     cards received, action rate, median response time, positive-outcome
//     rate, and a weekly mood trend ---
const getLoopHealthStats = async (req, res) => {
    try {
        const patientId = req.linkedPatientId;
        await expirePendingFollowUps(patientId);

        const outcomes = await SessionOutcome.find({ patientId }).sort({ createdAt: -1 });
        const cardsReceived = outcomes.filter((o) => o.decision && o.decision.code).length;

        if (cardsReceived < MIN_SESSIONS_FOR_LOOP_HEALTH) {
            return res.status(200).json({ success: true, hasEnoughData: false, cardsReceived });
        }

        const actedOn = outcomes.filter((o) => o.firstActedAt).length;
        const actionRate = cardsReceived ? Math.round((actedOn / cardsReceived) * 100) : 0;

        const allResponseSeconds = outcomes
            .flatMap((o) => o.actions.map((a) => a.responseSeconds))
            .filter((s) => typeof s === 'number');
        const medianResponseSeconds = median(allResponseSeconds);

        const evaluated = outcomes.filter((o) => o.followUp && o.followUp.status === 'evaluated');
        const better = evaluated.filter((o) => o.followUp.outcome === 'better').length;
        const positiveOutcomeRate = evaluated.length
            ? Math.round((better / evaluated.length) * 100)
            : null;

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyMoodTrend = outcomes
            .filter((o) => o.createdAt >= weekAgo)
            .map((o) => ({ date: o.createdAt, moodShiftPercent: o.moodShiftPercent }))
            .reverse(); // oldest first, for a left-to-right trend line

        res.status(200).json({
            success: true,
            hasEnoughData: true,
            cardsReceived,
            actedOn,
            actionRate,
            medianResponseSeconds,
            evaluatedFollowUps: evaluated.length,
            positiveOutcomeRate,
            weeklyMoodTrend,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    warmupEmotionService,
    captureEmotion,
    logEmotionReading,
    finalizeSession,
    getPatientOutcomes,
    acknowledgeAlert,
    recordAction,
    recordFollowUp,
    getEngagementStats,
    logAction,
    getLoopHealthStats,
    submitReaction,
};