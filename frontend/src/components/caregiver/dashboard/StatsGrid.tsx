import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { DashboardStats } from '../../../types/caregiver.types';

interface StatItem {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

interface StatsGridProps {
  stats: DashboardStats;
  onPatientPress?: () => void;
  onTaskPress?: () => void;
  onMedPress?: () => void;
  onAlertPress?: () => void;
}

const StatCard: React.FC<StatItem> = ({
  label, value, icon, color, bgColor, onPress
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 rounded-2xl p-4 shadow-sm"
    style={{ backgroundColor: Colors.white }}
    activeOpacity={0.85}
  >
    <View
      className="w-9 h-9 rounded-xl items-center justify-center mb-3"
      style={{ backgroundColor: bgColor }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text className="text-2xl font-bold" style={{ color: Colors.textPrimary }}>
      {value}
    </Text>
    <Text className="text-xs mt-0.5" style={{ color: Colors.textMuted }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  onPatientPress,
  onTaskPress,
  onMedPress,
  onAlertPress,
}) => {
  const items: StatItem[] = [
    {
      label: 'Patients',
      value: String(stats.patients),
      icon: 'people-outline',
      color: Colors.primary,
      bgColor: Colors.primaryLight,
      onPress: onPatientPress,
    },
    {
      label: 'Tasks',
      value: `${stats.tasks.completed}/${stats.tasks.total}`,
      icon: 'checkmark-circle-outline',
      color: Colors.success,
      bgColor: Colors.successSoft,
      onPress: onTaskPress,
    },
    {
      label: 'Meds',
      value: String(stats.meds),
      icon: 'medical-outline',
      color: Colors.purple,
      bgColor: Colors.purpleSoft,
      onPress: onMedPress,
    },
    {
      label: 'Alerts',
      value: String(stats.alerts),
      icon: 'alert-circle-outline',
      color: Colors.accent,
      bgColor: Colors.accentSoft,
      onPress: onAlertPress,
    },
  ];

  return (
    <View className="px-5 mt-4">
      <View className="flex-row gap-3">
        {items.slice(0, 2).map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </View>
      <View className="flex-row gap-3 mt-3">
        {items.slice(2).map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </View>
    </View>
  );
};