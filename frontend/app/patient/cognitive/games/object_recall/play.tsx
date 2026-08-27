import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, ObjectRecallConfig } from '@/src/types/games.types';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'study' | 'recall' | 'result';

export default function ObjectRecallGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<ObjectRecallConfig>(
    'object_recall',
    difficulty,
    patientId,
  );

  // Freeze the content for the duration of a round. Without this, a late
  // personalized response would swap the objects mid-game - which looked like
  // the items "reloading" a second or two after they first appeared.
  const [frozenConfig, setFrozenConfig] = useState<ObjectRecallConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  const [phase, setPhase] = useState<Phase>('instruction');
  const [inputs, setInputs] = useState<string[]>(Array(config.objectCount).fill(''));
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const warningSpokenRef = useRef(false);
  // A generated image that fails to load falls back to the item's emoji.
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markImageFailed = useCallback((uri?: string) => {
    if (!uri) return;
    setFailedImages(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);
  const canShowImage = (uri?: string) => !!uri && !failedImages.has(uri);

  useEffect(() => {
    if (phase !== 'study') return;
    const t = setTimeout(() => setPhase('recall'), config.displayTimeMs);
    return () => clearTimeout(t);
  }, [phase, config.displayTimeMs]);

  const timer = useQuestionTimer({
    limitSeconds: phase === 'recall' ? config.timeLimitSeconds : null,
    onExpire: () => finishGame(),
    autoStart: phase === 'recall',
  });

  useEffect(() => {
    if (phase === 'recall') {
      Speech.speak(`Now type the objects you remember. You have ${config.timeLimitSeconds} seconds. Take your time.`);
      warningSpokenRef.current = false;
    }
  }, [phase, config.timeLimitSeconds]);

  useEffect(() => {
    if (phase === 'recall' && timer.isWarning && !warningSpokenRef.current) {
      warningSpokenRef.current = true;
      Speech.speak('You are doing well.');
    }
  }, [phase, timer.isWarning]);

  const finishGame = useCallback(() => {
    const correct = inputs.filter((input, i) =>
      input.trim().toLowerCase() === config.objects[i]?.label.toLowerCase()
    ).length;
    const nextResult: GameSessionResult = {
      gameId: 'object_recall',
      difficulty,
      score: correct,
      maxScore: config.objectCount,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: config.objectCount,
    };

    if (correct === config.objectCount) {
      playSound('success');
    } else if (correct === 0) {
      playSound('error');
    } else {
      playSound('click');
    }

    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    setShowConfetti(true);
    Speech.speak(`Great effort. You got ${correct} out of ${config.objectCount}.`);
    setTimeout(() => {
      setShowConfetti(false);
      setPhase('result');
    }, 1100);
  }, [inputs, config, startTime, difficulty, playSound, saveGameSession]);

  const handleReset = () => {
    playSound('click');
    setFrozenConfig(null);
    setPhase('instruction');
    setInputs(Array(config.objectCount).fill(''));
    setResult(null);
    setProgress(null);
    setShowConfetti(false);
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="object_recall"
        difficulty={difficulty}
        steps={[
          { icon: '👁️', text: `Study ${config.objectCount} everyday objects carefully` },
          { icon: '⏱️', text: `You have ${config.displayTimeMs / 1000} seconds to memorise them` },
          { icon: '✍️', text: 'Then type the name of each object you remember' },
        ]}
        onStart={() => {
          playSound('click');
          setFrozenConfig(liveConfig);
          setPhase('study');
          setStartTime(Date.now());
          Speech.speak(`Study ${config.objectCount} objects carefully. They will disappear soon.`);
        }}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && (
        <ConfettiCannon count={100} origin={{ x: 180, y: 0 }} fadeOut />
      )}
      <GameHeader
        title="Object Recall"
        difficulty={difficulty}
        timeLeft={phase === 'recall' ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
      />

      {/* ── STUDY phase ──────────────────────────────────── */}
      {phase === 'study' && (
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
          <Text className="text-base text-gray-600 text-center mb-1 font-semibold">
            Memorise these objects
          </Text>
          <Text className="text-sm text-gray-400 text-center mb-6">
            They will disappear after {config.displayTimeMs / 1000}s
          </Text>

          <StudyCountdown durationMs={config.displayTimeMs} />

          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignContent: 'center',
              gap: 14,
              marginTop: 24,
            }}
          >
            {config.objects.map((obj, index) => (
              <Animated.View
                key={obj.id}
                entering={ZoomIn.delay(index * 100).duration(400)}
                style={{
                  width: 126,
                  height: 132,
                  backgroundColor: '#ffffff',
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: '#dbeafe',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {canShowImage(obj.image) ? (
                  <>
                    <Image
                      source={{ uri: obj.image }}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onError={() => markImageFailed(obj.image)}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 6,
                        paddingHorizontal: 6,
                        backgroundColor: 'rgba(17, 24, 39, 0.55)',
                      }}
                    >
                      <Text
                        style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', textAlign: 'center' }}
                        numberOfLines={1}
                      >
                        {obj.label}
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 52 }}>{obj.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginTop: 6,
                      }}
                    >
                      {obj.label}
                    </Text>
                  </>
                )}
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      {/* ── RECALL phase ─────────────────────────────────── */}
      {phase === 'recall' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 16,
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: 4,
                fontWeight: '600',
              }}
            >
              Type the objects you saw
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#9ca3af',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {inputs.filter(i => i.length > 0).length} of {config.objectCount} filled
            </Text>

            <View
              style={{
                height: 6,
                backgroundColor: '#e5e7eb',
                borderRadius: 999,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: timer.isWarning ? '#f87171' : '#60a5fa',
                  width: `${100 - timer.progressPercent}%`,
                }}
              />
            </View>

            {Array(config.objectCount)
              .fill(null)
              .map((_, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 80).duration(350)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#dbeafe',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: '#2563eb',
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>

                  <TextInput
                    value={inputs[i]}
                    onChangeText={val => {
                      const updated = [...inputs];
                      updated[i] = val;
                      setInputs(updated);
                    }}
                    placeholder={
                      config.showCategoryHints
                        ? `Hint: ${config.objects[i]?.category}`
                        : 'Type object name...'
                    }
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      height: 58,
                      backgroundColor: '#ffffff',
                      borderWidth: 2,
                      borderColor: inputs[i].length > 0 ? '#3b82f6' : '#e5e7eb',
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      fontSize: 17,
                      color: '#111827',
                    }}
                  />
                </Animated.View>
              ))}

            <Animated.View entering={FadeInUp.delay(config.objectCount * 80 + 100).duration(350)}>
            <TouchableOpacity
              onPress={finishGame}
              activeOpacity={0.85}
              style={{
                marginTop: 20,
                backgroundColor: '#3b82f6',
                paddingVertical: 16,
                borderRadius: 18,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Submit Answers
              </Text>
            </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function StudyCountdown({ durationMs }: { durationMs: number }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    const intervalMs = 100;
    const decrement = (intervalMs / durationMs) * 100;
    const t = setInterval(() => {
      setWidth(w => {
        if (w <= 0) {
          clearInterval(t);
          return 0;
        }
        return w - decrement;
      });
    }, intervalMs);
    return () => clearInterval(t);
  }, [durationMs]);

  return (
    <View
      style={{
        height: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          backgroundColor: '#fbbf24',
          borderRadius: 999,
          width: `${width}%`,
        }}
      />
    </View>
  );
}
