import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BurnoutCard } from '../BurnoutCard';
import { BurnoutRisk } from '../../../../types/caregiver.types';

// A realistic "Moderate" burnout object, similar to what the backend's
// calculateBurnoutRisk() would return.
const moderateBurnout: BurnoutRisk = {
  riskScore: 45,
  riskLevel: 'Moderate',
  trend: 'worsening',
  forecast: 'Burnout risk is increasing. If this trend continues, high risk is expected within 7-14 days.',
  factors: [
    {
      factor: 'Sleep deprivation',
      severity: 'high',
      description: 'Average 5.2 hours sleep (need 7+)',
      icon: 'moon',
    },
  ],
  daysAnalyzed: 8,
  avgStressScore: 6.4,
  avgSleep: 5.2,
  consecutiveHigh: 0,
};

describe('BurnoutCard', () => {
  it('renders the risk level and score', async () => {
    await render(<BurnoutCard burnout={moderateBurnout} />);

    expect(screen.getByText('Moderate Risk')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('7-DAY BURNOUT FORECAST')).toBeTruthy();
  });

  it('does not show the forecast sentence (removed from the UI)', async () => {
    await render(<BurnoutCard burnout={moderateBurnout} />);

    expect(screen.queryByText(/If this trend continues/i)).toBeNull();
  });

  it('shows risk factors only after the card is expanded', async () => {
    await render(<BurnoutCard burnout={moderateBurnout} />);

    expect(screen.queryByText('Sleep deprivation')).toBeNull();

    await fireEvent.press(screen.getByText('Moderate Risk'));

    expect(screen.getByText('Sleep deprivation')).toBeTruthy();
    expect(screen.getByText('Average 5.2 hours sleep (need 7+)')).toBeTruthy();
  });

  it('shows the "not enough data" notice when fewer than 3 days are analyzed', async () => {
    const earlyBurnout: BurnoutRisk = { ...moderateBurnout, daysAnalyzed: 1 };
    await render(<BurnoutCard burnout={earlyBurnout} />);

    expect(
      screen.getByText('Complete 2 more check-in(s) to unlock full forecast')
    ).toBeTruthy();
  });
});