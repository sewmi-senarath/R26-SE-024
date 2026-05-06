import { GAME_CONFIGS } from '@/src/constants/games';
import { Difficulty, GameId } from '@/src/types/games.types';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface InstructionStep {
  icon: string;
  text: string;
}

interface Props {
  gameId: GameId;
  difficulty: Difficulty;
  steps: InstructionStep[];
  onStart: () => void;
}

export function InstructionScreen({ gameId, difficulty, steps, onStart }: Props) {
  const router = useRouter();
  const config = GAME_CONFIGS[gameId];
  const c = config.color;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 pt-4 pb-2 flex-row items-center gap-1"
        >
          <Text className="text-blue-500 text-lg font-medium">← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View className={`mx-6 rounded-3xl border p-8 items-center mb-8 mt-6 ${c.bg} ${c.border}`}>
          <View className={`w-28 h-28 rounded-3xl items-center justify-center mb-6 ${c.icon}`}>
            <Text style={{ fontSize: 56 }}>{config.icon}</Text>
          </View>
          <Text className="text-4xl font-bold text-gray-900 text-center mb-4">
            {config.title}
          </Text>
          <Text className="text-base text-gray-600 text-center mb-5 leading-relaxed">
            {config.description}
          </Text>
        </View>

        {/* How to play */}
        <View className="mx-6 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-3xl bg-lime-200 rounded-xl">❓</Text>
            <Text className="text-2xl font-bold text-gray-900">How to play</Text>
          </View>
          <View className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            {steps.map((step, i) => (
              <View
                key={i}
                className={`px-6 py-5 gap-4 ${i < steps.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="text-xl text-gray-700 leading-relaxed font-bold">{step.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start button — fixed at bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={onStart}
          className="bg-blue-500 py-5 rounded-3xl items-center active:bg-blue-600"
        >
          <Text className="text-white font-bold text-3xl">Start Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}