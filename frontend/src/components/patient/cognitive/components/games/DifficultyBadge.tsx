import React from 'react';
import { View, Text } from 'react-native';
import { Difficulty } from '@/src/types/games.types';

interface Props {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

const STYLES: Record<Difficulty, { bg: string; text: string; dot: string; label: string }> = {
  easy:   { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500',  label: 'Easy'   },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500',  label: 'Medium' },
  hard:   { bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500',    label: 'Hard'   },
};

export function DifficultyBadge({ difficulty, size = 'md' }: Props) {
  const s = STYLES[difficulty];
  const small = size === 'sm';

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full ${s.bg} ${small ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
      <View className={`rounded-full ${s.dot} ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      <Text className={`font-semibold ${s.text} text-xs`}>{s.label}</Text>
    </View>
  );
}