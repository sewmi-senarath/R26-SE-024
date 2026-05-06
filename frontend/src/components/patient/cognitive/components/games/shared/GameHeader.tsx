import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Difficulty } from '@/src/types/games.types';
import { DifficultyBadge } from '../DifficultyBadge';

interface Props {
  title: string;
  difficulty: Difficulty;
  timeLeft?: number | null;
  onExit?: () => void;
}

export function GameHeader({ title, difficulty, timeLeft, onExit }: Props) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pt-4 pb-2 gap-3">
      <TouchableOpacity
        onPress={onExit ?? (() => router.back())}
        className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
      >
        <Text className="text-gray-500 text-sm">✕</Text>
      </TouchableOpacity>
      <Text className="flex-1 text-base font-bold text-gray-900">{title}</Text>
      <DifficultyBadge difficulty={difficulty} size="sm" />
      {timeLeft != null && (
        <View className={`px-2.5 py-1 rounded-xl ${timeLeft <= 10 ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Text className={`text-xs font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            {timeLeft}s
          </Text>
        </View>
      )}
    </View>
  );
}