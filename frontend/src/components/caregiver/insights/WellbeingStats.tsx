import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { WellbeingStats as WellbeingStatsType } from '../../../types/caregiver.types';

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({
  icon, iconColor, iconBg, label, value,
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: Colors.white,
      borderRadius: 18,
      padding: 14,
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: Colors.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    }}
  >
    <View
      style={{
        width: 34, height: 34, borderRadius: 11,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
      }}
    >
      <Ionicons name={icon} size={17} color={iconColor} />
    </View>
    <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '500', marginBottom: 2 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
      {value}
    </Text>
  </View>
);

interface WellbeingStatsProps {
  stats: WellbeingStatsType;
}

export const WellbeingStats: React.FC<WellbeingStatsProps> = ({ stats }) => (
  <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
      <StatItem
        icon="moon-outline"
        iconColor="#8B5CF6"
        iconBg="#F5F3FF"
        label="Avg Sleep"
        value={`${stats.avgSleep} hrs`}
      />
      <StatItem
        icon="heart-outline"
        iconColor={Colors.danger}
        iconBg={Colors.dangerSoft}
        label="Active Hours"
        value={`${stats.activeHours} hrs`}
      />
    </View>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <StatItem
        icon="checkmark-circle-outline"
        iconColor={Colors.success}
        iconBg={Colors.successSoft}
        label="Tasks Done"
        value={`${stats.tasksCompleted}`}
      />
      <StatItem
        icon="cafe-outline"
        iconColor={Colors.accent}
        iconBg={Colors.accentSoft}
        label="Breaks Taken"
        value={`${stats.breaksTaken}`}
      />
    </View>
  </View>
);
