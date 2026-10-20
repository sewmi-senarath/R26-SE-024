import React from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { LoopHealthStats } from '../../../types/family.types';
import { Card } from '../ui/Card';

interface LoopHealthPanelProps {
  stats: LoopHealthStats;
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.textPrimary }}>{value}</Text>
    <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>{label}</Text>
  </View>
);

export const LoopHealthPanel: React.FC<LoopHealthPanelProps> = ({ stats }) => {
  if (!stats.hasEnoughData) {
    return (
      <Card style={{ marginHorizontal: 20, marginTop: 20, alignItems: 'center' }} padding={20}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 }}>LOOP HEALTH</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center' }}>
          Not enough sessions yet — this fills in after a few more story sessions.
        </Text>
      </Card>
    );
  }

  const responseLabel = stats.medianResponseSeconds == null
    ? '—'
    : stats.medianResponseSeconds < 60
      ? `${stats.medianResponseSeconds}s`
      : `${Math.round(stats.medianResponseSeconds / 60)}m`;

  const trend = stats.weeklyMoodTrend || [];
  const maxAbs = Math.max(1, ...trend.map((t) => Math.abs(t.moodShiftPercent)));

  return (
    <Card style={{ marginHorizontal: 20, marginTop: 20 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>LOOP HEALTH</Text>
      <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 14 }}>
        {stats.cardsReceived} cards received this cycle
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 14 }}>
        <Stat value={`${stats.actionRate ?? 0}%`} label="Acted on" />
        <Stat value={responseLabel} label="Median response" />
        <Stat
          value={stats.positiveOutcomeRate == null ? '—' : `${stats.positiveOutcomeRate}%`}
          label="Helped next time"
        />
      </View>

      {trend.length > 0 && (
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, letterSpacing: 0.4 }}>
            THIS WEEK'S MOOD TREND
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 4 }}>
            {trend.map((t, i) => {
              const barColor = t.moodShiftPercent > 0 ? Colors.success : t.moodShiftPercent < 0 ? Colors.danger : Colors.textMuted;
              const height = Math.max(3, Math.round((Math.abs(t.moodShiftPercent) / maxAbs) * 36));
              return (
                <View key={i} style={{ flex: 1, height: 36, justifyContent: 'flex-end' }}>
                  <View style={{ height, backgroundColor: barColor, borderRadius: 3 }} />
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
};
