const calculateBurnoutRisk = (checkIns) => {
  if (!checkIns || checkIns.length === 0) {
    return {
      riskScore:      0,
      riskLevel:      'Low',
      trend:          'stable',
      forecast:       'Complete at least 3 check-ins to unlock your burnout forecast.',
      factors:        [],
      daysAnalyzed:   0,
      avgStressScore: 0,
      avgSleep:       0,
      consecutiveHigh:0,
    };
  }

  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
  );
  const n = sorted.length;

  // Stress trend
  const stressScores = sorted.map(c => c.stressScore);
  const recentAvg    = average(stressScores.slice(-3));
  const earlierAvg   = n >= 5 ? average(stressScores.slice(0, -3)) : recentAvg;
  const stressTrend  = recentAvg - earlierAvg;

  // Consecutive high stress days
  let consecutiveHigh = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].stressLevel === 'High') consecutiveHigh++;
    else break;
  }

  // Averages
  const avgSleep       = average(sorted.map(c => c.sleepHours));
  const avgBreaks      = average(sorted.map(c => c.breaksTaken));
  const avgEmotional   = average(
    sorted.map(c => (c.emotionalOverwhelm + c.emotionallyDrained + c.mentallyExhausted) / 3)
  );
  const avgCompletionRate = average(
    sorted.map(c => c.tasksCompleted / Math.max(c.tasksAssigned, 1))
  );

  const sleepDeprived      = avgSleep < 6;
  const insufficientBreaks = avgBreaks < 1.5;
  const overloaded         = avgCompletionRate < 0.7;

  // Calculate score
  let score = 0;
  score += Math.min(25, Math.max(0, stressTrend * 5 + 10));
  score += Math.min(20, consecutiveHigh * 7);
  if (sleepDeprived)       score += Math.min(20, (6 - avgSleep) * 8);
  score += Math.min(20, (avgEmotional - 2) * 8);
  if (insufficientBreaks)  score += 10;
  if (overloaded)          score += 5;
  score = Math.round(Math.min(100, Math.max(0, score)));

  // Risk level
  let riskLevel;
  if (score >= 65)      riskLevel = 'High';
  else if (score >= 35) riskLevel = 'Moderate';
  else                  riskLevel = 'Low';

  // Trend direction
  let trend;
  if (stressTrend > 1.5)       trend = 'worsening';
  else if (stressTrend < -1.5) trend = 'improving';
  else                          trend = 'stable';

  // Forecast message
  const forecast = generateForecast(riskLevel, trend, consecutiveHigh, n);

  // Risk factors
  const factors = [];

  if (consecutiveHigh >= 2) {
    factors.push({
      factor:      'Consecutive high stress days',
      severity:    'high',
      description: `${consecutiveHigh} days of high stress in a row`,
      icon:        'warning',
    });
  }

  if (sleepDeprived) {
    factors.push({
      factor:      'Sleep deprivation',
      severity:    'high',
      description: `Average ${avgSleep.toFixed(1)} hours sleep (need 7+)`,
      icon:        'moon',
    });
  }

  if (avgEmotional > 3.5) {
    factors.push({
      factor:      'High emotional burden',
      severity:    avgEmotional > 4 ? 'high' : 'moderate',
      description: `Emotional load averaging ${avgEmotional.toFixed(1)}/5`,
      icon:        'heart',
    });
  }

  if (insufficientBreaks) {
    factors.push({
      factor:      'Insufficient breaks',
      severity:    'moderate',
      description: `Only ${avgBreaks.toFixed(1)} breaks per shift on average`,
      icon:        'coffee',
    });
  }

  if (stressTrend > 1.5) {
    factors.push({
      factor:      'Stress trend increasing',
      severity:    'moderate',
      description: 'Stress level has been rising over past few days',
      icon:        'trending-up',
    });
  }

  if (overloaded) {
    factors.push({
      factor:      'Task overload',
      severity:    'moderate',
      description: `Only completing ${Math.round(avgCompletionRate * 100)}% of assigned tasks`,
      icon:        'clipboard',
    });
  }

  return {
    riskScore:       score,
    riskLevel,
    trend,
    forecast,
    factors,
    daysAnalyzed:    n,
    avgStressScore:  average(stressScores),
    avgSleep,
    avgBreaks,
    consecutiveHigh,
  };
};

const generateForecast = (riskLevel, trend, consecutiveHigh, daysAnalyzed) => {
  if (daysAnalyzed < 3) {
    return `Complete ${3 - daysAnalyzed} more check-in(s) to unlock your 7-day burnout forecast.`;
  }
  if (riskLevel === 'High' && trend === 'worsening') {
    return 'Burnout is likely within 7 days if current patterns continue. Immediate action is strongly recommended.';
  }
  if (riskLevel === 'High' && trend === 'stable') {
    return 'You are operating at high burnout risk. Without intervention, this is unsustainable beyond 7-10 days.';
  }
  if (riskLevel === 'High' && trend === 'improving') {
    return 'Burnout risk is high but improving. Keep up the positive changes - lower risk expected within 3-5 days.';
  }
  if (riskLevel === 'Moderate' && trend === 'worsening') {
    return 'Burnout risk is increasing. If this trend continues, high risk is expected within 7-14 days.';
  }
  if (riskLevel === 'Moderate' && trend === 'stable') {
    return 'Burnout risk is moderate. Taking small daily actions now will prevent escalation.';
  }
  if (riskLevel === 'Moderate' && trend === 'improving') {
    return 'Good progress - your burnout risk is improving. On track for low risk within a week.';
  }
  return 'Burnout risk is low. You are managing your wellbeing well. Keep it up!';
};

const average = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

module.exports = { calculateBurnoutRisk };