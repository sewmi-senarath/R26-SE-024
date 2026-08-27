import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export interface RadarPoint {
  label: string;
  /** 0 - 100 */
  value: number;
}

interface Props {
  data: RadarPoint[];
  size?: number;
  color?: string;
  ringCount?: number;
}

function pointOnAxis(index: number, count: number, radius: number, center: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function RadarChart({ data, size = 220, color = '#3b82f6', ringCount = 4 }: Props) {
  const center = size / 2;
  const labelPadding = 34;
  const maxRadius = center - labelPadding;
  const count = data.length;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [data]);

  const animatedProps = useAnimatedProps(() => {
    // NOTE: this runs on the UI thread on native. It must NOT call an external
    // non-worklet function (e.g. pointOnAxis) - doing so is a silent hard crash
    // on iOS/Android while working fine on web. So the axis math is inlined.
    const points = data
      .map((point, i) => {
        const r = (Math.max(0, Math.min(100, point.value)) / 100) * maxRadius * progress.value;
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
    return { points };
  });

  if (count < 3) return null;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background rings */}
        {Array.from({ length: ringCount }, (_, ringIndex) => {
          const fraction = (ringIndex + 1) / ringCount;
          const ringPoints = Array.from({ length: count }, (_, i) => {
            const { x, y } = pointOnAxis(i, count, maxRadius * fraction, center);
            return `${x},${y}`;
          }).join(' ');
          return (
            <Polygon
              key={ringIndex}
              points={ringPoints}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const { x, y } = pointOnAxis(i, count, maxRadius, center);
          return (
            <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={1} />
          );
        })}

        {/* Animated data polygon */}
        <AnimatedPolygon
          animatedProps={animatedProps}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={2}
        />

        {/* Axis labels */}
        {data.map((point, i) => {
          const { x, y } = pointOnAxis(i, count, maxRadius + labelPadding * 0.8, center);
          return (
            <SvgText
              key={point.label}
              x={x}
              y={y}
              fontSize={11}
              fontWeight="700"
              fill="#4b5563"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {point.label}
            </SvgText>
          );
        })}

        {/* Center dot */}
        <Circle cx={center} cy={center} r={2} fill="#d1d5db" />
      </Svg>
    </View>
  );
}
