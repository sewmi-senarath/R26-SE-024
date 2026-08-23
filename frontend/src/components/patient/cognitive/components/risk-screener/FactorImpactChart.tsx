import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

// Real feature-importance weights learned by the screener model
// (Extra Trees, trained in backend/ml/dementia/train_screener.py — see the
// printed "Feature importance" table from that run). Restricted here to the
// 7 caregiver-observable checklist items so the chart only ever shows
// factors the person actually answered "yes" to.
const IMPORTANCE: Record<string, { weight: number; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  MemoryComplaints: { weight: 0.379, icon: "chatbox-ellipses-outline", label: "Memory complaints", color: "#EF4444" },
  BehavioralProblems: { weight: 0.175, icon: "alert-circle-outline", label: "Behavioral changes", color: "#F97316" },
  Forgetfulness: { weight: 0.024, icon: "time-outline", label: "Forgetfulness", color: "#F59E0B" },
  DifficultyCompletingTasks: { weight: 0.018, icon: "list-outline", label: "Difficulty with tasks", color: "#8B5CF6" },
  Confusion: { weight: 0.018, icon: "help-circle-outline", label: "Confusion", color: "#3B82F6" },
  Disorientation: { weight: 0.018, icon: "compass-outline", label: "Disorientation", color: "#06B6D4" },
  PersonalityChanges: { weight: 0.016, icon: "happy-outline", label: "Personality changes", color: "#EC4899" },
};

const AnimatedBar: React.FC<{ pct: number; color: string; delay: number }> = ({ pct, color, delay }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ height: 8, backgroundColor: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: color,
          width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
};

interface FactorImpactChartProps {
  factors: string[]; // ranked topFactors from the API response
}

export const FactorImpactChart: React.FC<FactorImpactChartProps> = ({ factors }) => {
  const known = factors.filter((f) => IMPORTANCE[f]);
  if (known.length === 0) return null;

  const maxWeight = Math.max(...known.map((f) => IMPORTANCE[f].weight));

  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        What&apos;s Driving This
      </Text>
      {known.map((f, i) => {
        const cfg = IMPORTANCE[f];
        const pct = Math.round((cfg.weight / maxWeight) * 100);
        return (
          <View key={f} className="mb-3">
            <View className="flex-row items-center gap-2 mb-1.5">
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: cfg.color + "20" }}
              >
                <Ionicons name={cfg.icon} size={13} color={cfg.color} />
              </View>
              <Text className="text-xs font-semibold text-gray-700 flex-1">{cfg.label}</Text>
            </View>
            <AnimatedBar pct={pct} color={cfg.color} delay={i * 150} />
          </View>
        );
      })}
    </View>
  );
};
