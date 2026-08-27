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

// Step icons may be an emoji ("✋", "⏱️") or an Ionicons glyph name ("image",
// "book"). Emoji are non-ASCII, glyph names are plain ASCII words — so we can
// tell them apart and render each correctly.
function StepIcon({ icon, size, color }: { icon: string; size: number; color: string }) {
  const isGlyphName = /^[a-z0-9-]+$/.test(icon);
  if (isGlyphName) {
    return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
  }
  return <Text style={{ fontSize: size }}>{icon}</Text>;
}

interface Props {
  gameId: GameId;
  difficulty: Difficulty;
  steps: InstructionStep[];
  onStart: () => void;
  onBack?: () => void;
  startDisabled?: boolean;
  startLabel?: string;
  /** Optional secondary button shown above Start (e.g. "Open Family Album"). */
  secondaryAction?: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

export function InstructionScreen({
  gameId,
  difficulty,
  steps,
  onStart,
  onBack,
  startDisabled = false,
  startLabel = 'Start Game',
  secondaryAction,
}: Props) {
  const router = useRouter();
  const config = GAME_CONFIGS[gameId];
  const c = config.color;
  const tile = c.tile; // vivid per-game accent color (hex)
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
          entering={FadeInDown.duration(450)}
          className={`mx-6 rounded-3xl border p-8 items-center mb-8 mt-6 ${c.bg} ${c.border}`}
        >
          <Animated.View
            entering={ZoomIn.delay(100).duration(400)}
            className={`w-28 h-28 rounded-3xl items-center justify-center mb-6 ${c.icon}`}
            style={{ borderWidth: 3, borderColor: tile }}
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
        <Animated.View entering={FadeInUp.delay(200).duration(450)} className="mx-6 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-11 h-11 rounded-2xl bg-lime-100 items-center justify-center">
              <Text style={{ fontSize: 22 }}>❓</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">How to play</Text>
          </View>

          <View className="gap-3">
            {steps.map((step, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(260 + i * 90).duration(420)}
                className="bg-white rounded-3xl border border-gray-100 p-4 flex-row items-center gap-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Numbered icon medallion */}
                <View className={`w-16 h-16 rounded-2xl items-center justify-center ${c.icon}`}>
                  <StepIcon icon={step.icon} size={30} color={tile} />
                  <View
                    style={{
                      position: 'absolute',
                      top: -7,
                      left: -7,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: tile,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2.5,
                      borderColor: '#ffffff',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>{i + 1}</Text>
                  </View>
                </View>

                <Text className="flex-1 text-xl font-bold text-gray-800 leading-snug">
                  {step.text}
                </Text>
              </Animated.View>
            ))}
          </View>

          {/* Gentle reassurance */}
          <Animated.View
            entering={FadeInUp.delay(260 + steps.length * 90).duration(400)}
            className="flex-row items-center justify-center gap-2 mt-6"
          >
            <Text style={{ fontSize: 20 }}>💛</Text>
            <Text className="text-base text-gray-500 font-semibold text-center">
              Take your time — there is no rush.
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Start button — fixed at bottom */}
      <Animated.View
        entering={FadeInUp.delay(150).duration(400)}
        className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-white border-t border-gray-200"
      >
        {secondaryAction ? (
          <TouchableOpacity
            onPress={() => {
              stopInstructions();
              secondaryAction.onPress();
            }}
            activeOpacity={0.85}
            className="py-4 rounded-3xl items-center mb-3 border-2 border-purple-300 bg-purple-50 flex-row justify-center gap-2"
          >
            {secondaryAction.icon ? (
              <Ionicons name={secondaryAction.icon} size={22} color="#9333ea" />
            ) : null}
            <Text className="text-purple-700 font-bold text-xl">{secondaryAction.label}</Text>
          </TouchableOpacity>
        ) : null}
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
