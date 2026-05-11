import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Difficulty } from '@/src/types/games.types';
import { DifficultyBadge } from '../DifficultyBadge';

interface Props {
  title: string;
  difficulty: Difficulty;
  timeLeft?: number | null;
  onExit?: () => void;
  onBack?: () => void;
}

export function GameHeader({ title, difficulty, timeLeft, onExit, onBack }: Props) {
  const router = useRouter();
  const handleBack = onExit ?? onBack ?? (() => router.back());

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

      {timeLeft != null && (
        <View
          className={`px-2.5 py-1 rounded-xl ${timeLeft <= 10 ? 'bg-red-100' : 'bg-blue-100'}`}
          style={{ flexShrink: 0, minWidth: 48, alignItems: 'center' }}
        >
          <Text className={`text-xs font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
            {timeLeft}s
          </Text>
        </View>
      )}
    </View>
  );
}
