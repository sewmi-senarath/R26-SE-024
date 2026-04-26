import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  current: number;   // 1-based display
  total: number;
  sectionName: string;
}

export function ProgressBar({ current, total, sectionName }: Props) {
  const pct = (current / total) * 100;

  return (
    <View className="px-6 pt-4 pb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-gray-500 font-medium">{sectionName}</Text>
        <Text className="text-xs text-gray-400">{current} / {total}</Text>
      </View>
      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}