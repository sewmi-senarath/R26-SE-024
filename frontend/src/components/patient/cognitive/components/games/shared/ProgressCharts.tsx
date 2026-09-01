import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export interface TrendPoint {
  label: string;
  percent: number; // 0 - 100
}

interface TrendBarChartProps {
  data: TrendPoint[];
  height?: number;
  barColor?: string;
  passColor?: string;
  passThreshold?: number;
}

const TREND_LABEL_SPACE = 20;

function TrendBar({
  point,
  index,
  height,
  color,
}: {
  point: TrendPoint;
  index: number;
  height: number;
  color: string;
}) {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(
      index * 70,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [grow, index, point.percent]);

  const style = useAnimatedStyle(() => ({
    height: `${Math.max(4, point.percent) * grow.value}%`,
  }));

  return (
    <View style={{ flex: 1, alignItems: 'center', height: height + TREND_LABEL_SPACE }}>
      <View
        style={{
          width: '70%',
          height: '100%',
          justifyContent: 'flex-end',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#f3f4f6',
        }}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              borderRadius: 8,
              backgroundColor: color,
            },
            style,
          ]}
        />
      </View>
      <Text
        style={{ fontSize: 10, color: '#9ca3af', marginTop: 6, fontWeight: '600' }}
        numberOfLines={1}
      >
        {point.label}
      </Text>
    </View>
  );
}

/** Small animated bar chart showing recent session accuracy trend. */
export function TrendBarChart({
  data,
  height = 90,
  barColor = '#3b82f6',
  passColor = '#22c55e',
  passThreshold = 60,
}: TrendBarChartProps) {
  if (data.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 8, height: height + TREND_LABEL_SPACE }}>
      {data.map((point, i) => (
        <TrendBar
          key={`${point.label}-${i}`}
          point={point}
          index={i}
          height={height}
          color={point.percent >= passThreshold ? passColor : barColor}
        />
      ))}
    </View>
  );
}

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

/** Small animated donut chart, e.g. for difficulty distribution. */
export function DonutChart({ segments, size = 84, strokeWidth = 14 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {total === 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((segment, i) => {
              const fraction = segment.value / total;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const rotation = offsetAccumulator * 360;
              offsetAccumulator += fraction;
              return (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeLinecap="butt"
                  origin={`${size / 2}, ${size / 2}`}
                  rotation={rotation}
                />
              );
            })
        )}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{total}</Text>
        <Text style={{ fontSize: 9, color: '#9ca3af', fontWeight: '600' }}>games</Text>
      </View>
    </View>
  );
}
