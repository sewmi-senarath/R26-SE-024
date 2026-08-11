import { useSoundEffects } from "@/src/hooks/useSoundEffects";
import { RiskLevel, RiskResult } from "@/src/types/dementia.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Text, TouchableOpacity, View } from "react-native";
import Explosion from "react-native-confetti-cannon";
import { FactorImpactChart } from "./FactorImpactChart";
import { RiskGauge } from "./RiskGauge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RISK_STYLES: Record<RiskLevel, { bg: string; border: string; emoji: string }> = {
  low: { bg: "bg-green-50", border: "border-green-200", emoji: "🙂" },
  moderate: { bg: "bg-amber-50", border: "border-amber-200", emoji: "🤔" },
  high: { bg: "bg-red-50", border: "border-red-200", emoji: "⚠️" },
};

interface RiskResultCardProps {
  result: RiskResult;
  onRetake: () => void;
  onTakeFullAssessment?: () => void;
}

export const RiskResultCard: React.FC<RiskResultCardProps> = ({ result, onRetake, onTakeFullAssessment }) => {
  const { playSound } = useSoundEffects();
  const styles = RISK_STYLES[result.riskLevel];
  const confettiRef = useRef<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
    ]).start();

    if (result.riskLevel === "low") {
      void playSound("success");
      const t = setTimeout(() => confettiRef.current?.start(), 500);
      return () => clearTimeout(t);
    } else if (result.riskLevel === "high") {
      void playSound("error");
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      void playSound("click");
    }
  }, [result.riskLevel]);

  const emojiScale = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View>
      {result.riskLevel === "low" && (
        <Explosion
          ref={confettiRef}
          count={70}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          fadeOut
          autoStart={false}
          fallSpeed={2600}
        />
      )}

      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        className={`rounded-3xl border p-6 mb-6 ${styles.bg} ${styles.border}`}
      >
        <View className="flex-row items-center gap-3 mb-1">
          <Animated.Text style={{ fontSize: 38, transform: [{ scale: emojiScale }] }}>{styles.emoji}</Animated.Text>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">Screening Result</Text>
            <Text className="text-xl font-extrabold text-gray-900 capitalize">{result.riskLevel} Risk</Text>
          </View>
        </View>

        {/* Animated circular gauge */}
        <View className="items-center my-3">
          <RiskGauge probability={result.riskProbability} level={result.riskLevel} />
        </View>

        <Text className="text-sm text-gray-600 text-center mb-5">{result.message}</Text>

        {result.topFactors.length > 0 && (
          <View className="bg-white/70 rounded-2xl p-4 mb-2">
            <FactorImpactChart factors={result.topFactors} />
          </View>
        )}
      </Animated.View>

      <View className="flex-row gap-3 mb-8">
        <TouchableOpacity
          onPress={onRetake}
          className="flex-1 py-3.5 rounded-2xl items-center border border-gray-200 bg-white flex-row justify-center gap-2"
        >
          <Ionicons name="refresh-outline" size={16} color="#475569" />
          <Text className="text-sm font-semibold text-gray-600">Retake</Text>
        </TouchableOpacity>
        {onTakeFullAssessment && (result.riskLevel === "moderate" || result.riskLevel === "high") && (
          <TouchableOpacity
            onPress={onTakeFullAssessment}
            className="flex-1 py-3.5 rounded-2xl items-center bg-blue-500 flex-row justify-center gap-2"
          >
            <Ionicons name="clipboard-outline" size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">Full Assessment</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
