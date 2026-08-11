import { RiskLevel } from "@/src/types/dementia.types";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RISK_COLORS: Record<RiskLevel, { main: string; track: string; glow: string; label: string }> = {
  low: { main: "#22C55E", track: "#DCFCE7", glow: "#86EFAC", label: "Low Risk" },
  moderate: { main: "#F59E0B", track: "#FEF3C7", glow: "#FCD34D", label: "Moderate Risk" },
  high: { main: "#EF4444", track: "#FEE2E2", glow: "#FCA5A5", label: "High Risk" },
};

interface RiskGaugeProps {
  probability: number; // 0-1
  level: RiskLevel;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ probability, level, size = 180 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const [displayPct, setDisplayPct] = useState(0);

  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const colors = RISK_COLORS[level];

  useEffect(() => {
    animatedValue.setValue(0);
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayPct(Math.round(value * 100));
    });

    Animated.timing(animatedValue, {
      toValue: probability,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listenerId);
  }, [probability]);

  // Gentle pulsing glow ring for high risk — draws the eye without being alarming
  useEffect(() => {
    if (level !== "high") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulseValue, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [level]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const pulseScale = pulseValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulseValue.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {level === "high" && (
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.glow,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          }}
        />
      )}

      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.main}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      </Svg>

      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 40, fontWeight: "900", color: colors.main }}>{displayPct}%</Text>
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 0.5 }}>
          {colors.label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};
