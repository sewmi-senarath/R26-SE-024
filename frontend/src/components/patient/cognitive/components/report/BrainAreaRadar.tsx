import { BRAIN_AREA_BY_SECTION } from "@/src/constants/brainAreas";
import { SectionName } from "@/src/types/games.types";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

export interface RadarDatum {
  section: SectionName;
  percent: number; // 0-100
}

interface BrainAreaRadarProps {
  data: RadarDatum[];
  size?: number;
}

const ORDER: SectionName[] = ["Orientation", "Registration", "Attention", "Recall", "Language"];

export const BrainAreaRadar: React.FC<BrainAreaRadarProps> = ({ data, size = 260 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }).start();
  }, [data.map((d) => d.percent).join(",")]);

  const byMap: Record<string, number> = {};
  data.forEach((d) => (byMap[d.section] = d.percent));

  const axes = ORDER.map((section) => ({
    section,
    percent: byMap[section] ?? 0,
    info: BRAIN_AREA_BY_SECTION[section],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 44;
  const n = axes.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const pointAt = (i: number, r: number) => {
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const dataPoints = axes.map((a, i) => pointAt(i, (Math.max(a.percent, 4) / 100) * maxR));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const hasAnyData = axes.some((a) => a.percent > 0);

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Svg width={size} height={size}>
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map((f) => {
            const ringPoints = axes.map((_, i) => pointAt(i, f * maxR));
            return (
              <Polygon
                key={f}
                points={ringPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={1}
              />
            );
          })}

          {/* Spokes */}
          {axes.map((_, i) => {
            const p = pointAt(i, maxR);
            return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E2E8F0" strokeWidth={1} />;
          })}

          {/* Data polygon */}
          {hasAnyData && (
            <Polygon points={dataPolygon} fill="#3B82F6" fillOpacity={0.25} stroke="#3B82F6" strokeWidth={2} />
          )}
          {hasAnyData &&
            dataPoints.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={4} fill={axes[i].info.color} stroke="#fff" strokeWidth={1.5} />
            ))}

          {/* Axis labels */}
          {axes.map((a, i) => {
            const labelPoint = pointAt(i, maxR + 18);
            return (
              <SvgText
                key={a.section}
                x={labelPoint.x}
                y={labelPoint.y}
                fontSize={10}
                fontWeight="700"
                fill="#475569"
                textAnchor="middle"
              >
                {a.section}
              </SvgText>
            );
          })}
        </Svg>
      </Animated.View>

      {!hasAnyData && (
        <Text className="text-xs text-gray-400 text-center mt-2 px-6">
          Play some games or complete an assessment to see this chart fill in.
        </Text>
      )}
    </View>
  );
};
