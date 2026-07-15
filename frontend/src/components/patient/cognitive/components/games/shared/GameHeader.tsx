import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Difficulty } from '@/src/types/games.types';
import { DifficultyBadge } from '../DifficultyBadge';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CircularProgress } from './CircularProgress';

interface Props {
  title: string;
  difficulty: Difficulty;
  timeLeft?: number | null;
  /** Total seconds for the countdown — enables the circular ring timer. */
  totalSeconds?: number | null;
  onExit?: () => void;
  onBack?: () => void;
}

export function GameHeader({ title, difficulty, timeLeft, totalSeconds, onExit, onBack }: Props) {
  const router = useRouter();
  const handleBack = onExit ?? onBack ?? (() => router.back());
  const isWarning = timeLeft != null && timeLeft <= 10;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isWarning) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isWarning]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      className="flex-row items-center px-4 pt-4 pb-2 gap-3"
      style={{ minHeight: 64 }}
    >
      <TouchableOpacity
        onPress={handleBack}
        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        style={{ flexShrink: 0 }}
      >
        <Text className="text-gray-500 text-sm">x</Text>
      </TouchableOpacity>

      <Text
        className="flex-1 text-base font-bold text-gray-900"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>

      <View style={{ flexShrink: 0 }}>
        <DifficultyBadge difficulty={difficulty} size="sm" />
      </View>

      {timeLeft != null && totalSeconds ? (
        <Animated.View entering={FadeIn.duration(300)} style={[{ flexShrink: 0 }, pulseStyle]}>
          <CircularProgress
            percent={(timeLeft / totalSeconds) * 100}
            size={44}
            strokeWidth={5}
            color={isWarning ? '#ef4444' : '#3b82f6'}
            label={`${timeLeft}`}
            delay={0}
          />
        </Animated.View>
      ) : timeLeft != null ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            {
              flexShrink: 0,
              minWidth: 48,
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: isWarning ? '#fee2e2' : '#dbeafe',
            },
            pulseStyle,
          ]}
        >
          <Text className={`text-xs font-bold ${isWarning ? 'text-red-600' : 'text-blue-600'}`}>
            {timeLeft}s
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
