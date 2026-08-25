const IMPAIRMENT_THRESHOLD = 23;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getAnswer(answers, questionId) {
  if (!answers) return undefined;
  if (typeof answers.get === "function") return answers.get(questionId);
  return answers[questionId];
}

function scoreAnswer(question, answer, session) {
  if (!question) return 0;

  switch (question.type) {
    case "mcq":
    case "image_mcq": {
      const selected = normalize(answer);
      const expected = (question.expectedAnswers || []).map(normalize);
      return expected.includes(selected) ? question.maxScore : 0;
    }

    case "text_input": {
      const expected = (question.expectedAnswers || []).map(normalize);

      // Fixed-answer text questions: exact (normalised) match.
      if (expected.length > 0) {
        return expected.includes(normalize(answer)) ? question.maxScore : 0;
      }

      // Free-form writing (MMSE "write a sentence"): a point is awarded for a
      // sensible attempt containing a subject and a verb. We can't parse
      // grammar reliably, so we approximate with "at least two word-like
      // tokens". Guard against non-string answers (e.g. a { skipped:true } object).
      if (typeof answer !== "string") return 0;
      const tokens = answer.trim().split(/\s+/).filter((t) => /[a-z0-9]/i.test(t));
      return tokens.length >= 2 ? question.maxScore : 0;
    }

    case "word_recall_display":
    case "word_recall_input": {
      // Dedupe recalled words so repeating the same correct word can't earn it
      // twice, and only count each target word once.
      const recalled = Array.isArray(answer)
        ? [...new Set(answer.map(normalize))].filter(Boolean)
        : [];
      const target = new Set(
        (question.words?.length ? question.words : session.registrationWords || []).map(normalize)
      );
      const correct = recalled.filter((word) => target.has(word)).length;
      return Math.min(correct, question.maxScore);
    }

    case "serial_subtraction": {
      // Standard MMSE scoring uses carry-forward: each subtraction is judged
      // against the patient's OWN previous answer, not the ideal sequence. So a
      // single arithmetic slip early on doesn't zero out every later step as
      // long as the patient keeps subtracting 7 correctly from their own number.
      const entered = Array.isArray(answer) ? answer.map((x) => String(x).trim()) : [];
      const start = 100;
      const step = 7;
      const steps = (question.expectedAnswers || []).length || 5;

      let points = 0;
      let base = start;
      for (let i = 0; i < steps; i += 1) {
        const expectedVal = base - step;
        const raw = entered[i];
        const num = Number(raw);
        const hasValue = raw !== undefined && raw !== "" && Number.isFinite(num);

        if (hasValue && num === expectedVal) points += 1;

        // Carry forward from the patient's own answer; if a step is blank, fall
        // back to the ideal value so one gap doesn't cascade into later steps.
        base = hasValue ? num : expectedVal;
      }
      return points;
    }

    case "instruction_action":
    case "phrase_repeat": {
      return answer === "correct" ? question.maxScore : 0;
    }

    case "drawing_canvas": {
      // Accept both boolean and "correct"/"incorrect"
      if (answer === true || answer === "correct") return question.maxScore;
      return 0;
    }

    default:
      return 0;
  }
}

function computeSectionScores(questions, answers, session) {
  const scores = {
    Orientation: 0,
    Registration: 0,
    Attention: 0,
    Recall: 0,
    Language: 0,
  };

  for (const q of questions) {
    if (!Object.prototype.hasOwnProperty.call(scores, q.section)) continue;

    const answer = getAnswer(answers, q.questionId);
    if (answer !== undefined) {
      const earned = scoreAnswer(q, answer, session);
      scores[q.section] += Number.isFinite(earned) ? earned : 0;
    }
  }

  return scores;
}

function computeTotalScore(sectionScores) {
  return Object.values(sectionScores).reduce(
    (sum, val) => sum + (Number.isFinite(val) ? val : 0),
    0
  );
}

function computeSeverity(score) {
  if (score >= 24) return "none";
  if (score >= 19) return "mild";
  if (score >= 10) return "moderate";
  return "severe";
}

function buildScoringLog(questions, answers, session) {
  return questions.map((q) => {
    const answer = getAnswer(answers, q.questionId);
    return {
      questionId: q.questionId,
      earned: answer !== undefined ? scoreAnswer(q, answer, session) : 0,
      max: q.maxScore,
    };
  });
}

function buildScoreSnapshot(questions, session) {
  const sectionScores = computeSectionScores(questions, session.answers || {}, session);
  const totalScore = computeTotalScore(sectionScores);
  const severity = computeSeverity(totalScore);

  return {
    sectionScores,
    totalScore,
    severity,
    impairmentFlag: totalScore <= IMPAIRMENT_THRESHOLD,
    scoringLog: buildScoringLog(questions, session.answers || {}, session),
  };
}

module.exports = {
  buildScoreSnapshot,
};
