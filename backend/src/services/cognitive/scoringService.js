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
      const text = normalize(answer);
      const expected = (question.expectedAnswers || []).map(normalize);
      return expected.includes(text) ? question.maxScore : 0;
    }

    case "word_recall_display":
    case "word_recall_input": {
      const recalled = Array.isArray(answer) ? answer.map(normalize) : [];
      const target = (question.words?.length ? question.words : session.registrationWords || []).map(normalize);
      const correct = recalled.filter((word) => target.includes(word)).length;
      return Math.min(correct, question.maxScore);
    }

    case "serial_subtraction": {
      const entered = Array.isArray(answer) ? answer.map((x) => String(x).trim()) : [];
      const expected = question.expectedAnswers || [];
      let points = 0;
      entered.forEach((value, i) => {
        if (value === expected[i]) points += 1;
      });
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
