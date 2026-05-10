// src/components/patient/cognitive/components/games/shared/GameResultScreen.tsx

import { GAME_CONFIGS } from '@/src/constants/games';
import { GameSessionResult } from '@/src/types/games.types';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  result: GameSessionResult;
  onPlayAgain: () => void;
}

export function GameResultScreen({ result, onPlayAgain }: Props) {
  const router = useRouter();
  const config = GAME_CONFIGS[result.gameId];
  const pct = Math.round((result.score / result.maxScore) * 100);
  const passed = pct >= 60;

  const difficultyLabel =
    result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      {/* ── Top section — centred content ──────────────────── */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 48,
          alignItems: 'center',
          justifyContent: 'center',  // ← vertically centres content in available space
        }}
      >
        {/* Result emoji circle */}
        <View
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
        </View>

        {/* Heading */}
        <Text
          style={{
            fontSize:35 ,
            fontWeight: '800',
            color: '#111827',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {passed ? 'Well done!' : 'Keep trying!'}
        </Text>

        {/* Score card */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#f3f4f6',
            padding: 24,
            // Shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Three stat columns */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            {/* Score */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 35,
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: 42,
                }}
              >
                {result.score}/{result.maxScore}
              </Text>
              <Text style={{ fontSize: 20, color: '#9ca3af818181', marginTop: 4 }}>
                Score
              </Text>
            </View>

            {/* Vertical divider */}
            <View
              style={{ width: 4, backgroundColor: '#f3f4f6', marginVertical: 1 }}
            />

            {/* Accuracy */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 35,
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: 42,
                }}
              >
                {pct}%
              </Text>
              <Text style={{ fontSize: 20, color: '#9ca3af818181', marginTop: 4 }}>
                Accuracy
              </Text>
            </View>

            {/* Vertical divider */}
            <View
              style={{ width: 4, backgroundColor: '#f3f4f6', marginVertical: 1 }}
            />

            {/* Time */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 35,
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: 42,
                }}
              >
                {result.timeTakenSeconds}s
              </Text>
              <Text style={{ fontSize: 20, color: '#9ca3af818181', marginTop: 4 }}>
                Time
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 10,
              backgroundColor: '#f3f4f6',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                borderRadius: 999,
                backgroundColor: passed ? '#22c55e' : '#f59e0b',
                width: `${pct}%`,
              }}
            />
          </View>

          {/* Pass / fail label under bar */}
          <Text
            style={{
              fontSize: 20,
              color: passed ? '#16a34a' : '#d97706',
              textAlign: 'right',
              marginTop: 6,
              fontWeight: '600',
            }}
          >
            {passed ? '✓ Passed' : 'Not passed yet'}
          </Text>
        </View>
      </View>

      {/* ── Bottom action buttons ───────────────────────────── */}
      <View
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
          style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 20 }}>
            Play Again
          </Text>
        </TouchableOpacity>

        {/* Back to Games */}
        <TouchableOpacity
          onPress={() => router.replace('/patient/games')}
          style={{
            borderWidth: 1.5,
            borderColor: '#e5e7eb',
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 20 }}>
            Back to Games
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}