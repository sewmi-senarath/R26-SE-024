import { DifficultyProgressUpdate } from '@/src/types/games.types';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { DifficultyBadge } from '../DifficultyBadge';

interface Props {
  progress: DifficultyProgressUpdate | null;
}

const TIER_RANK = { easy: 0, medium: 1, hard: 2 } as const;

export function DifficultyChangeBanner({ progress }: Props) {
  if (!progress || !progress.changed) return null;

  const leveledUp = TIER_RANK[progress.difficulty] > TIER_RANK[progress.previousDifficulty];

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(450).springify().damping(14)}
      style={{
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: leveledUp ? '#bbf7d0' : '#fde68a',
        backgroundColor: leveledUp ? '#f0fdf4' : '#fffbeb',
        padding: 16,
        marginTop: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Animated.Text entering={ZoomIn.delay(400).springify()} style={{ fontSize: 24 }}>
          {leveledUp ? '⬆️' : '⬇️'}
        </Animated.Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            {leveledUp ? 'Difficulty increased!' : 'Difficulty adjusted'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <DifficultyBadge difficulty={progress.previousDifficulty} size="sm" />
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>→</Text>
            <DifficultyBadge difficulty={progress.difficulty} size="sm" />
          </View>
          {progress.reason ? (
            <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 17 }}>
              {progress.reason}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
