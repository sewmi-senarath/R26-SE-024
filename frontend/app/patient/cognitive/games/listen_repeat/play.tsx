import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, ListenRepeatConfig, SequenceItem } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'listening' | 'recall' | 'result';

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ListenRepeatGame() {
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading, refresh: refreshContent, difficulty } = usePersonalizedGameContent<ListenRepeatConfig>(
    'listen_repeat',
    routeDifficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<ListenRepeatConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const isInputMode = config.answerMode === 'input';

  const [phase, setPhase] = useState<Phase>('instruction');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<string[]>(Array(config.wordCount).fill(''));
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markImageFailed = useCallback((uri?: string) => {
    if (!uri) return;
    setFailedImages(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);
  const canShowImage = (uri?: string) => !!uri && !failedImages.has(uri);

  // Choice grid = the spoken words plus decoys, shuffled once per round.
  const options = useMemo<SequenceItem[]>(() => {
    const usedLabels = new Set(config.items.map(i => i.label.trim().toLowerCase()));
    const distractors = (config.distractors ?? []).filter(d => {
      const key = d.label.trim().toLowerCase();
      if (usedLabels.has(key)) return false;
      usedLabels.add(key);
      return true;
    });
    return shuffle([...config.items, ...distractors]);
  }, [config.items, config.distractors]);

  const speakWords = useCallback(() => {
    Speech.stop();
    const spoken = config.items.map(i => i.label).join('. ');
    Speech.speak(`Listen carefully. ${spoken}.`, { rate: 0.92 });
  }, [config.items]);

  useEffect(() => {
    if (phase === 'listening') speakWords();
  }, [phase, speakWords]);

  const handleStart = () => {
    playSound('click');
    setFrozenConfig(liveConfig);
    setSelectedIds([]);
    setInputs(Array(liveConfig.wordCount).fill(''));
    setStartTime(Date.now());
    setPhase('listening');
  };

  const toggleSelect = (item: SequenceItem) => {
    const isSelected = selectedIds.includes(item.id);
    // Cap picks at the number of words heard, so "select everything" can't win.
    if (!isSelected && selectedIds.length >= config.wordCount) return;
    playSound('click');
    setSelectedIds(prev =>
      isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id],
    );
  };

  const finishGame = useCallback(() => {
    let correct = 0;
    if (isInputMode) {
      // Order-independent set match (each target credited at most once).
      const remaining = new Map<string, number>();
      config.items.forEach(it => {
        const key = it.label.trim().toLowerCase();
        remaining.set(key, (remaining.get(key) ?? 0) + 1);
      });
      inputs.forEach(input => {
        const key = input.trim().toLowerCase();
        if (!key) return;
        const left = remaining.get(key);
        if (left && left > 0) {
          remaining.set(key, left - 1);
          correct += 1;
        }
      });
    } else {
      const itemIds = new Set(config.items.map(i => i.id));
      correct = selectedIds.filter(id => itemIds.has(id)).length;
    }

    if (correct === config.wordCount) playSound('success');
    else if (correct === 0) playSound('error');
    else playSound('click');

    const nextResult: GameSessionResult = {
      gameId: 'listen_repeat',
      difficulty,
      score: correct,
      maxScore: config.wordCount,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: config.wordCount,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    setShowConfetti(true);
    Speech.speak(`You got ${correct} out of ${config.wordCount}.`);
    setTimeout(() => {
      setShowConfetti(false);
      setPhase('result');
    }, 1100);
  }, [isInputMode, config, inputs, selectedIds, difficulty, startTime, playSound, saveGameSession]);

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    refreshContent(progress?.difficulty);
    setFrozenConfig(null);
    setPhase('instruction');
    setSelectedIds([]);
    setInputs(Array(config.wordCount).fill(''));
    setResult(null);
    setProgress(null);
    setShowConfetti(false);
  };

  const handleGoBack = () => {
    playSound('back');
    Speech.stop();
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="listen_repeat"
        difficulty={difficulty}
        steps={[
          { icon: '🔊', text: `Listen to ${config.wordCount} words read aloud` },
          { icon: '🧠', text: 'Hold them in your mind' },
          {
            icon: isInputMode ? '✍️' : '👆',
            text: isInputMode
              ? 'Then type each word you heard'
              : 'Then tap the words you heard',
          },
        ]}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return (
      <GameResultScreen
        result={result}
        progress={progress}
        onPlayAgain={handleReset}
        onBack={handleGoBack}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={90} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader
        title="Listen & Repeat"
        difficulty={difficulty}
        timeLeft={null}
        totalSeconds={null}
        onBack={handleGoBack}
      />

      {/* ── LISTENING phase ─────────────────────────────────── */}
      {phase === 'listening' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 24 }}>
          <Animated.View
            entering={ZoomIn.duration(400)}
            className="w-28 h-28 rounded-full bg-indigo-100 items-center justify-center"
          >
            <Ionicons name="volume-high" size={56} color="#4F46E5" />
          </Animated.View>
          <Text className="text-lg font-semibold text-gray-700 text-center">
            Listen carefully to the words
          </Text>
          <Text className="text-sm text-gray-400 text-center">
            {config.allowReplay
              ? 'You can play them again if you need to.'
              : 'They will only be read once.'}
          </Text>

          <View style={{ gap: 12, width: '100%', maxWidth: 320 }}>
            {config.allowReplay && (
              <TouchableOpacity
                onPress={() => { playSound('click'); speakWords(); }}
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-indigo-200"
              >
                <Ionicons name="refresh-outline" size={18} color="#4F46E5" />
                <Text className="text-base font-bold text-indigo-600">Play again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => { playSound('click'); Speech.stop(); setPhase('recall'); }}
              activeOpacity={0.85}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: '#6366F1' }}
            >
              <Text className="text-base font-bold text-white">I&apos;m ready</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── RECALL phase ────────────────────────────────────── */}
      {phase === 'recall' && !isInputMode && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <Text className="text-lg text-gray-600 text-center font-semibold mb-1">
              Tap the words you heard
            </Text>
            <Text className="text-sm text-gray-400 text-center mb-4">
              {selectedIds.length} of {config.wordCount} selected
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {options.map(item => {
                const selected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleSelect(item)}
                    activeOpacity={0.85}
                    style={{ width: 150, height: 132, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: selected ? '#6366F1' : '#e5e7eb', backgroundColor: selected ? '#EEF2FF' : '#fff', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {canShowImage(item.image) ? (
                      <Image source={{ uri: item.image }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" onError={() => markImageFailed(item.image)} />
                    ) : (
                      <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
                    )}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 6, backgroundColor: selected ? 'rgba(79,70,229,0.85)' : 'rgba(17,24,39,0.55)' }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </View>
                    {selected && (
                      <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#6366F1', borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={15} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
            <TouchableOpacity
              onPress={finishGame}
              disabled={selectedIds.length === 0}
              className={`py-4 rounded-2xl items-center ${selectedIds.length > 0 ? 'bg-indigo-500' : 'bg-gray-200'}`}
            >
              <Text className={`font-bold text-lg ${selectedIds.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                Submit Answers
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === 'recall' && isInputMode && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text className="text-lg text-gray-600 text-center font-semibold mb-1">
              Type the words you heard
            </Text>
            <Text className="text-sm text-gray-400 text-center mb-4">
              {inputs.filter(i => i.trim().length > 0).length} of {config.wordCount} filled
            </Text>

            {Array(config.wordCount).fill(null).map((_, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 70).duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#4F46E5' }}>{i + 1}</Text>
                </View>
                <TextInput
                  value={inputs[i]}
                  onChangeText={val => {
                    const updated = [...inputs];
                    updated[i] = val;
                    setInputs(updated);
                  }}
                  placeholder="Type a word you heard…"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  returnKeyType="next"
                  style={{ flex: 1, height: 56, backgroundColor: '#fff', borderWidth: 2, borderColor: inputs[i].trim().length > 0 ? '#6366F1' : '#e5e7eb', borderRadius: 16, paddingHorizontal: 16, fontSize: 17, color: '#111827' }}
                />
              </Animated.View>
            ))}

            <TouchableOpacity onPress={finishGame} activeOpacity={0.85} style={{ marginTop: 12, backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 18, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit Answers</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
