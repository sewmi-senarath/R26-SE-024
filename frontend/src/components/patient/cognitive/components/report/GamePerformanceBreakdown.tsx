import { getBrainAreaForSection } from "@/src/constants/brainAreas";
import { GAME_CONFIGS } from "@/src/constants/games";
import { PerGameStat } from "@/src/hooks/usePatientReport";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

function formatRelative(iso: string | null) {
  if (!iso) return "Not played yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not played yet";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const AnimatedBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
};

interface GamePerformanceBreakdownProps {
  perGame: PerGameStat[];
}

export const GamePerformanceBreakdown: React.FC<GamePerformanceBreakdownProps> = ({ perGame }) => {
  const played = perGame.filter((g) => g.plays > 0);
  const notPlayed = perGame.filter((g) => g.plays === 0);

  if (played.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-sm text-gray-400">No games played yet.</Text>
      </View>
    );
  }

  return (
    <View>
      {played.map((g, idx) => {
        const cfg = GAME_CONFIGS[g.gameId];
        const brainArea = getBrainAreaForSection(cfg.targetSection);
        const isLast = idx === played.length - 1;
        return (
          <View
            key={g.gameId}
            className={`mb-4 pb-4 ${isLast ? "" : "border-b border-gray-50"}`}
          >
            <View className="flex-row items-center gap-3 mb-2">
              <View className={`w-10 h-10 rounded-xl items-center justify-center ${cfg.color.icon}`}>
                <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800">{cfg.title}</Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brainArea.color }} />
                  <Text className="text-[11px] text-gray-500">{brainArea.shortArea}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-base font-extrabold text-gray-900">{g.avgPercent}%</Text>
                <Text className="text-[10px] text-gray-400">avg of {g.plays}</Text>
              </View>
            </View>

            <AnimatedBar pct={g.avgPercent} color={brainArea.color} />

            <View className="flex-row justify-between mt-1.5">
              <Text className="text-[11px] text-gray-400">Best: {g.bestPercent}%</Text>
              <Text className="text-[11px] text-gray-400">{formatRelative(g.lastPlayed)}</Text>
            </View>
          </View>
        );
      })}

      {notPlayed.length > 0 && (
        <View className="mt-1">
          <Text className="text-[11px] text-gray-400 mb-2">Not tried yet:</Text>
          <View className="flex-row flex-wrap gap-2">
            {notPlayed.map((g) => (
              <View key={g.gameId} className="px-2.5 py-1 rounded-full bg-gray-50">
                <Text className="text-[11px] text-gray-400">{GAME_CONFIGS[g.gameId].title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
