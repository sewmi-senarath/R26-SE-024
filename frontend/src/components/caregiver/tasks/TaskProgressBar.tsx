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

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: Colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Daily Progress
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: Colors.textPrimary,
              marginTop: 2,
            }}
          >
            {completed} of {total} tasks
          </Text>
        </View>

        <View
          style={{
            backgroundColor:
              percent >= 100
                ? Colors.successSoft
                : percent >= 50
                ? Colors.primaryLight
                : Colors.warningSoft,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '800',
              color:
                percent >= 100
                  ? Colors.success
                  : percent >= 50
                  ? Colors.primary
                  : Colors.warning,
            }}
          >
            {percent}%
          </Text>
        </View>
      </View>

      {/* Bar track */}
      <View
        style={{
          height: 10,
          backgroundColor: Colors.borderLight,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 10,
            backgroundColor:
              percent >= 100
                ? Colors.success
                : percent >= 50
                ? Colors.primary
                : Colors.warning,
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
};