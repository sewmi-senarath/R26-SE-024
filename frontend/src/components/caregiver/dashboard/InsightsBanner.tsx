import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { CaregiverInsight } from '../../../types/caregiver.types';

interface InsightsBannerProps {
  insight: CaregiverInsight;
  onPress?: () => void;
}

export const InsightsBanner: React.FC<InsightsBannerProps> = ({ insight, onPress }) => {
  const progressPercent = (insight.score / 100) * 100;

  const levelColor =
    insight.level === 'Low'
      ? Colors.success
      : insight.level === 'Moderate'
      ? Colors.warning
      : Colors.danger;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-5 mt-5 rounded-2xl p-4"
      style={{
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-xl items-center justify-center"
            style={{ backgroundColor: Colors.warningSoft }}
          >
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
          </View>
          <Text className="font-bold text-sm" style={{ color: Colors.textPrimary }}>
            Caregiver Insights
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>

      <View className="flex-row items-end gap-3 mb-2">
        <Text className="text-4xl font-bold" style={{ color: Colors.textPrimary }}>
          {insight.score}
        </Text>
        <View className="mb-1 flex-row items-center gap-2">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: levelColor + '20' }}
          >
            <Text className="text-xs font-semibold" style={{ color: levelColor }}>
              {insight.level}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: Colors.textMuted }}>
            Risk
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        className="h-2 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: Colors.borderLight }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: levelColor,
          }}
        />
      </View>

      <Text className="text-xs" style={{ color: Colors.textMuted }}>
        {insight.message}
      </Text>
    </TouchableOpacity>
  );
};