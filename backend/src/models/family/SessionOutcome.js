const mongoose = require('mongoose');

const sessionOutcomeSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    memoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMemory',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    baselineEmotion: {
      // dominant emotion from the FIRST reading in the session
      type: String,
    },
    peakEmotion: {
      // the most positive emotion detected at any point 
      // during the session
      type: String,
    },
    finalEmotion: {
      // dominant emotion from the LAST reading in the session
      type: String,
    },
    mostFrequentEmotion: {
      // whichever emotion showed up as the dominant reading most often
      // across the WHOLE session — "what was she mostly feeling", not
      // just the start/end snapshots
      type: String,
      default: null,
    },
    moodLift: {
      // calculated score: positive = improved mood, 
      // negative = mood declined during the story
      // (exact calculation logic goes in the controller, 
      // not the schema — schema just stores the result)
      type: Number,
      default: 0,
    },
    totalReadings: {
      type: Number,
      default: 0,
    },
    // real 0-100 confidence percentages, averaged across the baseline vs
    // final readings — what the family dashboard's mood-shift card displays
    sadBeforePercent: {
      type: Number,
      default: 0,
    },
    happyBeforePercent: {
      type: Number,
      default: 0,
    },
    happyAfterPercent: {
      type: Number,
      default: 0,
    },
    moodShiftPercent: {
      // happyAfterPercent - happyBeforePercent
      type: Number,
      default: 0,
    },
    alertTriggered: {
      type: Boolean,
      default: false,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    actedAt: {
      // when the family member tapped "Call Now" on this alert
      type: Date,
      default: null,
    },
    followUpOutcome: {
      // how the family member said the call went, self-reported afterward
      type: String,
      enum: ['positive', 'neutral', 'difficult', null],
      default: null,
    },
    playbackDurationSeconds: {
      type: Number,
    },

    // ── Close-the-loop: Decide / Act / Log / Check ──────────────────────
    // computed by services/family/decisionEngine.js — first at finalize
    // time with mood only (recallScore null, usually lands on
    // not_enough_data honestly), then recomputed once the story's quiz
    // attempt completes and real recall becomes available.
    decision: {
      code: {
        type: String,
        enum: ['strong_happy', 'comforting_fading', 'clear_painful', 'confusing_upsetting', 'not_enough_data'],
        default: null,
      },
      title: { type: String, default: null },
      text: { type: String, default: null },
      confidence: { type: String, enum: ['high', 'medium', 'low', null], default: null },
      talkAboutTip: { type: String, default: null },
      quality: {
        framesUsed: { type: Number, default: null },
        framesTotal: { type: Number, default: null },
      },
      inputs: { type: mongoose.Schema.Types.Mixed, default: null },
      suggestedActions: { type: [String], default: [] },
      computedAt: { type: Date, default: null },
    },

    // every action a family member has taken on this session's card —
    // an array so more than one can be logged (e.g. call_now then, later,
    // dismiss)
    actions: {
      type: [
        {
          type: {
            type: String,
            enum: [
              'send_similar_story', 'share_with_family', 'call_or_visit',
              'show_photo_together', 'pause_topic', 'try_gentler_story',
              'call_now', 'dismiss',
            ],
            required: true,
          },
          takenAt: { type: Date, required: true },
          takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          responseSeconds: { type: Number, default: null },
        },
      ],
      default: [],
    },
    firstActedAt: { type: Date, default: null },

    // set by the `share_with_family` action — lets other linked family
    // members' view of this same session highlight it as shared, since
    // every linked family member already sees every session via the
    // existing getPatientOutcomes/getDueEvents-style patientId scoping
    sharedAt: { type: Date, default: null },

    // stage 6 — was the next session, if any, better/worse/same than this
    // one after the family acted on it
    followUp: {
      status: { type: String, enum: ['pending', 'evaluated', 'no_followup'], default: null },
      nextSessionId: { type: String, default: null },
      outcome: { type: String, enum: ['better', 'same', 'worse', null], default: null },
      moodDelta: { type: Number, default: null },
      recallDelta: { type: Number, default: null },
      evaluatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionOutcome', sessionOutcomeSchema);