import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { FamilyRadius, FamilyShadow } from '../../../constants/familyTheme';
import { FamilyDashboardStats } from '../../../types/family.types';
import { IconChip } from '../ui/IconChip';

interface StatsGridProps {
  stats: FamilyDashboardStats;
  onMoodPress: () => void;
  onAlertPress: () => void;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, iconColor, iconBg, onPress, suffix,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flex: 1,
      backgroundColor: Colors.white,
      borderRadius: FamilyRadius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.borderLight,
      ...FamilyShadow.card,
    }}
  >
    <View style={{ marginBottom: 10 }}>
      <IconChip icon={icon} color={iconColor} bg={iconBg} size={36} radius={FamilyRadius.sm} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>{value}</Text>
      {suffix && (
        <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600' }}>{suffix}</Text>
      )}
    </View>
    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats, onMoodPress, onAlertPress,
}) => (
  <View style={{ marginHorizontal: 20, marginTop: 16 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>
      TODAY'S OVERVIEW
    </Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <StatCard
        label="Mood Score"
        value={stats.moodScore}
        icon="happy-outline"
        iconColor={Colors.success}
        iconBg={Colors.successSoft}
        onPress={onMoodPress}
        suffix="%"
      />
      <StatCard
        label="Active Alerts"
        value={stats.activeAlerts}
        icon="notifications-outline"
        iconColor={Colors.danger}
        iconBg={Colors.dangerSoft}
        onPress={onAlertPress}
      />
    </View>
  </View>
);
