import React from "react";
import { View, Text } from "react-native";

interface Props {
  secondsLeft: number;
  isWarning: boolean;
  timeLimit: number;
}

export function TimerBar({ secondsLeft, isWarning, timeLimit }: Props) {
  const safeTimeLimit = Math.max(timeLimit, 1);
  const pct = Math.max(0, Math.min(100, (secondsLeft / safeTimeLimit) * 100));

  return (
    <View className="px-6 mb-4">
      <View className="flex-row justify-end mb-1">
        <Text
          className={`text-xs font-semibold ${
            isWarning ? "text-red-500" : "text-gray-400"
          }`}
        >
          {secondsLeft}s
        </Text>
      </View>
      <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${
            isWarning ? "bg-red-400" : "bg-blue-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}