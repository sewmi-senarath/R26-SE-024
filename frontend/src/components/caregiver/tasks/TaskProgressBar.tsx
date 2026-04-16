import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Colors } from '../../../constants/colors';

interface TaskProgressBarProps {
  completed: number;
  total: number;
}

export const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  completed,
  total,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const barColor =
    percent >= 100 ? Colors.success :
    percent >= 50  ? Colors.primary :
                     Colors.warning;

  const badgeBg =
    percent >= 100 ? Colors.successSoft :
    percent >= 50  ? Colors.primaryLight :
                     Colors.warningSoft;

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 18,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View>
          <Text style={{
            fontSize: 10, fontWeight: '700', color: Colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
          }}>
            Daily Progress
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.textPrimary }}>
            {completed}{' '}
            <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.textMuted }}>
              of {total} tasks
            </Text>
          </Text>
        </View>

        <View style={{
          backgroundColor: badgeBg,
          paddingHorizontal: 14, paddingVertical: 8,
          borderRadius: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: barColor }}>
            {percent}%
          </Text>
        </View>
      </View>

      {/* Progress track */}
      <View style={{
        height: 10, backgroundColor: Colors.borderLight,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: '100%', borderRadius: 10,
          backgroundColor: barColor,
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }} />
      </View>

      {/* Milestone labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {['0%', '25%', '50%', '75%', '100%'].map((label) => (
          <Text key={label} style={{ fontSize: 9, color: Colors.textMuted, fontWeight: '500' }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};