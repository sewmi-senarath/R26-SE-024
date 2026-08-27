import { MMSESession } from "@/src/types/assessment.types";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

const CHART_HEIGHT = 160;
const CHART_PADDING_X = 28;
const CHART_PADDING_TOP = 12;
const CHART_PADDING_BOTTOM = 24;

function severityColor(score: number) {
  if (score >= 24) return "#22C55E";
  if (score >= 19) return "#F59E0B";
  if (score >= 10) return "#F97316";
  return "#EF4444";
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface AssessmentTrendChartProps {
  assessments: MMSESession[]; // ascending by completedAt
  width: number;
}

export const AssessmentTrendChart: React.FC<AssessmentTrendChartProps> = ({ assessments, width }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [assessments.length]);

  if (assessments.length < 2) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-gray-400 text-center">
          {assessments.length === 1
            ? "One assessment completed so far - trend chart appears after the next one."
            : "No completed assessments yet."}
        </Text>
      </View>
    );
  }

  const plotWidth = width - CHART_PADDING_X * 2;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const n = assessments.length;

  const points = assessments.map((a, i) => {
    const x = CHART_PADDING_X + (n === 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth);
    const y = CHART_PADDING_TOP + (1 - Math.min(a.totalScore, 30) / 30) * plotHeight;
    return { x, y, score: a.totalScore, date: a.completedAt || "" };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const bands = [
    { from: 24, to: 30, color: "#22C55E" },
    { from: 19, to: 24, color: "#F59E0B" },
    { from: 10, to: 19, color: "#F97316" },
    { from: 0, to: 10, color: "#EF4444" },
  ];

  const yFor = (score: number) => CHART_PADDING_TOP + (1 - score / 30) * plotHeight;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Severity zone bands */}
        {bands.map((b) => (
          <Rect
            key={b.from}
            x={CHART_PADDING_X}
            y={yFor(b.to)}
            width={plotWidth}
            height={yFor(b.from) - yFor(b.to)}
            fill={b.color}
            opacity={0.06}
          />
        ))}

        {/* Gridlines */}
        {[0, 15, 30].map((v) => (
          <React.Fragment key={v}>
            <Line
              x1={CHART_PADDING_X}
              x2={width - CHART_PADDING_X}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="#E2E8F0"
              strokeWidth={1}
              strokeDasharray={v === 0 ? undefined : "3,4"}
            />
            <SvgText x={2} y={yFor(v) + 4} fontSize={9} fill="#94A3B8">
              {v}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Trend line */}
        <Polyline points={polylinePoints} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={severityColor(p.score)} stroke="#fff" strokeWidth={2} />
        ))}
      </Svg>

      {/* X-axis date labels (first, middle, last only to avoid crowding) */}
      <View className="flex-row justify-between px-1">
        <Text className="text-[10px] text-gray-400">{formatShortDate(points[0].date)}</Text>
        {n > 2 && (
          <Text className="text-[10px] text-gray-400">{formatShortDate(points[Math.floor((n - 1) / 2)].date)}</Text>
        )}
        <Text className="text-[10px] text-gray-400">{formatShortDate(points[n - 1].date)}</Text>
      </View>
    </Animated.View>
  );
};
