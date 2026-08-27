// src/components/patient/cognitive/components/games/shared/GameResultScreen.tsx

import { GAME_CONFIGS } from '@/src/constants/games';
import { DifficultyProgressUpdate, GameSessionResult } from '@/src/types/games.types';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { CircularProgress } from './CircularProgress';
import { DifficultyChangeBanner } from './DifficultyChangeBanner';

interface Props {
  result: GameSessionResult;
  onPlayAgain: () => void;
  onBack?: () => void;
  /** Adaptive-difficulty update returned after saving this session, if any. */
  progress?: DifficultyProgressUpdate | null;
}

export function GameResultScreen({ result, onPlayAgain, onBack, progress }: Props) {
  const router = useRouter();
  const config = GAME_CONFIGS[result.gameId];
  const pct = Math.round((result.score / result.maxScore) * 100);
  const passed = pct >= 60;
  const [showConfetti, setShowConfetti] = useState(passed);

  useEffect(() => {
    Haptics.notificationAsync(
      passed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      {showConfetti && (
        <ConfettiCannon
          count={110}
          origin={{ x: 200, y: 0 }}
          fadeOut
          fallSpeed={2600}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      {/* ── Top section — centred content ──────────────────── */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Result emoji circle */}
        <Animated.View
          entering={ZoomIn.duration(500)}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: passed ? '#dcfce7' : '#fef3c7',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 48 }}>{passed ? '🎉' : '💪'}</Text>
        </Animated.View>

        {/* Heading */}
        <Animated.Text
          entering={FadeInDown.delay(120).duration(400)}
          style={{
            fontSize: 32,
            fontWeight: '800',
            color: '#111827',
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          {passed ? 'Well done!' : 'Keep trying!'}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(180).duration(400)}
          style={{
            fontSize: 15,
            color: '#9ca3af',
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          {config.title} · {result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1)}
        </Animated.Text>

        {/* Score card */}
        <Animated.View
          entering={FadeInUp.delay(220).duration(500)}
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#f3f4f6',
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Accuracy ring chart */}
          <CircularProgress
            percent={pct}
            size={132}
            strokeWidth={14}
            color={passed ? '#22c55e' : '#f59e0b'}
            sublabel="Accuracy"
          />

          {/* Score / Time stat row */}
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-around',
              marginTop: 22,
              paddingTop: 18,
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
            }}
          >
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>
                {result.score}/{result.maxScore}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontWeight: '600' }}>
                Score
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: '#f3f4f6' }} />

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>
                {result.timeTakenSeconds}s
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontWeight: '600' }}>
                Time
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 16,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: passed ? '#dcfce7' : '#fef3c7',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: passed ? '#16a34a' : '#d97706',
                fontWeight: '700',
              }}
            >
              {passed ? '✓ Passed' : 'Not passed yet'}
            </Text>
          </View>
        </Animated.View>

        <DifficultyChangeBanner progress={progress ?? null} />
      </View>

      {/* ── Bottom action buttons ───────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(360).duration(400)}
        style={{
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          paddingTop: 16,
          gap: 10,
        }}
      >
        {/* Play Again */}
        <TouchableOpacity
          onPress={onPlayAgain}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 18 }}>
            Play Again
          </Text>
        </TouchableOpacity>

        {/* Back to Games */}
        <TouchableOpacity
          onPress={onBack ?? (() => router.replace('/patient/games'))}
          activeOpacity={0.85}
          style={{
            borderWidth: 1.5,
            borderColor: '#e5e7eb',
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 18 }}>
            Back to Games
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
