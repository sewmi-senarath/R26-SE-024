import { GAME_CONFIGS } from '@/src/constants/games';
import { Difficulty, GameId } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface InstructionStep {
  icon: string;
  text: string;
}

interface Props {
  gameId: GameId;
  difficulty: Difficulty;
  steps: InstructionStep[];
  onStart: () => void;
  onBack?: () => void;
  startDisabled?: boolean;
  startLabel?: string;
}

export function InstructionScreen({
  gameId,
  difficulty,
  steps,
  onStart,
  onBack,
  startDisabled = false,
  startLabel = 'Start Game',
}: Props) {
  const router = useRouter();
  const config = GAME_CONFIGS[gameId];
  const c = config.color;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isSpeaking) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isSpeaking]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const spokenInstructions = useMemo(
    () =>
      [
        `${config.title}.`,
        config.description,
        'How to play.',
        ...steps.map((step, index) => `Step ${index + 1}. ${step.text}.`),
      ].join(' '),
    [config.description, config.title, steps]
  );

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const stopInstructions = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleListenPress = () => {
    if (isSpeaking) {
      stopInstructions();
      return;
    }

    setIsSpeaking(true);
    Speech.speak(spokenInstructions, {
      rate: 0.9,
      pitch: 1,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleBackPress = () => {
    stopInstructions();
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  const handleStartPress = () => {
    stopInstructions();
    onStart();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={handleBackPress}
          className="px-6 pt-4 pb-2 flex-row items-center gap-1"
        >
          <Text className="text-blue-500 text-lg font-medium">← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(450).springify().damping(16)}
          className={`mx-6 rounded-3xl border p-8 items-center mb-8 mt-6 ${c.bg} ${c.border}`}
        >
          <Animated.View
            entering={ZoomIn.delay(100).duration(400).springify().damping(12)}
            className={`w-28 h-28 rounded-3xl items-center justify-center mb-6 ${c.icon}`}
          >
            <Text style={{ fontSize: 56 }}>{config.icon}</Text>
          </Animated.View>
          <Text className="text-4xl font-bold text-gray-900 text-center mb-4">
            {config.title}
          </Text>
          <Text className="text-base text-gray-600 text-center mb-5 leading-relaxed">
            {config.description}
          </Text>
          <Animated.View style={pulseStyle}>
            <TouchableOpacity
              onPress={handleListenPress}
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? 'Stop listening to instructions' : 'Listen to instructions'}
              className={`px-6 py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                isSpeaking ? 'bg-gray-900 active:bg-gray-800' : 'bg-blue-500 active:bg-blue-600'
              }`}
            >
              <Ionicons
                name={isSpeaking ? 'stop-circle' : 'volume-high'}
                size={24}
                color="#ffffff"
              />
              <Text className="text-white text-xl font-bold">
                {isSpeaking ? 'Stop Instructions' : 'Listen to Instructions'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* How to play */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} className="mx-6 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-3xl bg-lime-200 rounded-xl">❓</Text>
            <Text className="text-2xl font-bold text-gray-900">How to play</Text>
          </View>
          <View className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            {steps.map((step, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(260 + i * 80).duration(400)}
                className={`px-6 py-5 gap-4 ${i < steps.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="text-xl text-gray-700 leading-relaxed font-bold">{step.text}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Start button — fixed at bottom */}
      <Animated.View
        entering={FadeInUp.delay(150).duration(400)}
        className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-white border-t border-gray-200"
      >
        <TouchableOpacity
          onPress={handleStartPress}
          disabled={startDisabled}
          activeOpacity={0.85}
          className={`py-5 rounded-3xl items-center ${
            startDisabled ? 'bg-gray-300' : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          <Text className="text-white font-bold text-3xl">{startLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
