import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useQuestionTimer } from '@/src/hooks/useQuestionTimer';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, MemoryRecallConfig } from '@/src/types/games.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Phase = 'instruction' | 'showing' | 'recall' | 'result';

function SelectableOption({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(selected ? 1.05 : 1, { duration: 130 });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={ZoomIn.duration(300)} style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{ overflow: 'hidden' }}
        className={`w-40 h-40 rounded-2xl border-2 items-center justify-center ${
          selected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-200'
        }`}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MemoryRecallGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<MemoryRecallConfig>(
    'memory_recall',
    difficulty,
    patientId,
  );

  // Freeze the content for the duration of a round. Without this, a late
  // personalized response would swap the words mid-game — which looked like the
  // items "reloading" a second or two after they first appeared.
  const [frozenConfig, setFrozenConfig] = useState<MemoryRecallConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  const [phase, setPhase] = useState<Phase>('instruction');
  // A generated image that fails to load (e.g. a cold URL that timed out) is
  // treated as "no image" so the item falls back to its emoji instead of a
  // blank card.
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markImageFailed = useCallback((uri?: string) => {
    if (!uri) return;
    setFailedImages(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);
  const canShowImage = (uri?: string) => !!uri && !failedImages.has(uri);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);

  useEffect(() => {
    if (phase !== 'showing') return;
    if (currentShowIndex >= config.items.length) {
      setTimeout(() => setPhase('recall'), 500);
      return;
    }
    const t = setTimeout(() => setCurrentShowIndex(i => i + 1), config.displayTimeMs);
    return () => clearTimeout(t);
  }, [phase, currentShowIndex, config]);

  const timer = useQuestionTimer({
    limitSeconds: phase === 'recall' ? config.timeLimitSeconds : null,
    onExpire: () => finishGame(),
    autoStart: phase === 'recall',
  });

  const handleStart = () => {
    playSound('click');
    setFrozenConfig(liveConfig);
    setPhase('showing');
    setCurrentShowIndex(0);
    setStartTime(Date.now());
  };

  const ALL_OPTIONS = useMemo(() => {
    const extras: typeof config.items = [
      { id: 'd1', emoji: '🎸', label: 'Guitar', category: 'Music' },
      { id: 'd2', emoji: '🚂', label: 'Train', category: 'Vehicle' },
      { id: 'd3', emoji: '🍕', label: 'Pizza', category: 'Food' },
    ];
    const base = [...config.items, ...extras];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    return base;
  }, [config.items]);

  const toggleSelect = useCallback((id: string) => {
    playSound('click');
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(x => x !== id) : [...prev, id];
      const item = ALL_OPTIONS.find(o => o.id === id);
      if (item) {
        Speech.speak(isSelected ? `${item.label} deselected` : `${item.label} selected`);
      }
      return next;
    });
  }, [ALL_OPTIONS, playSound]);

  useEffect(() => {
    if (phase === 'recall') {
      Speech.speak(`Select all ${config.items.length} items you remember.. Tap to select or deselect. Take your time.`);
    }
  }, [phase, config.items.length]);

  const finishGame = useCallback(() => {
    const correct = config.items.filter(item => selectedIds.includes(item.id)).length;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(correct);
    
    if (correct === config.items.length) {
      playSound('success');
    } else if (correct === 0) {
      playSound('error');
    } else {
      playSound('click');
    }

    const nextResult: GameSessionResult = {
      gameId: 'memory_recall',
      difficulty,
      score: correct,
      maxScore: config.items.length,
      timeTakenSeconds: timeTaken,
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: config.items.length,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    Speech.speak(`You scored ${correct} out of ${config.items.length}.`);
    setPhase('result');
  }, [selectedIds, config, startTime, difficulty, playSound, saveGameSession]);

  const handleReset = () => {
    playSound('click');
    setFrozenConfig(null);
    setPhase('instruction');
    setCurrentShowIndex(0);
    setSelectedIds([]);
    setScore(0);
    setResult(null);
    setProgress(null);
  };

  const handleGoBack = () => {
    playSound('back');
    router.back();
  };

  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="memory_recall"
        difficulty={difficulty}
        steps={[
          { icon: '👀', text: 'Watch the sequence of items that appear one by one' },
          { icon: '🧠', text: 'Memorise each item carefully' },
          { icon: '☑️', text: `Select all ${config.items.length} items you remember from the grid` },
          ...(config.showHints ? [{ icon: '💡', text: 'Category hints are shown to help you' }] : []),
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
      <GameHeader
        title="Memory Recall"
        difficulty={difficulty}
        timeLeft={phase === 'recall' ? timer.secondsLeft : null}
        totalSeconds={config.timeLimitSeconds}
        onBack={handleGoBack}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        {/* SHOWING phase */}
        {phase === 'showing' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Text className="text-sm text-gray-400 uppercase tracking-wide">
              Remember this item ({currentShowIndex + 1} of {config.items.length})
            </Text>
            {currentShowIndex < config.items.length ? (
              <Animated.View
                key={currentShowIndex}
                entering={ZoomIn.duration(400)}
                style={{ overflow: 'hidden' }}
                className="w-56 h-56 bg-white rounded-3xl border border-gray-100 items-center justify-center shadow-sm"
              >
                {canShowImage(config.items[currentShowIndex].image) ? (
                  <>
                    <Image
                      source={{ uri: config.items[currentShowIndex].image }}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onError={() => markImageFailed(config.items[currentShowIndex].image)}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: 'rgba(17, 24, 39, 0.55)',
                      }}
                    >
                      <Text className="text-lg font-bold text-white text-center">
                        {config.items[currentShowIndex].label}
                      </Text>
                      {config.showHints && (
                        <Text className="text-xs text-gray-200 text-center mt-0.5">
                          {config.items[currentShowIndex].category}
                        </Text>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 82 }}>{config.items[currentShowIndex].emoji}</Text>
                    <Text className="text-lg font-semibold text-gray-800 mt-2">
                      {config.items[currentShowIndex].label}
                    </Text>
                    {config.showHints && (
                      <Text className="text-sm text-gray-400 mt-1">
                        {config.items[currentShowIndex].category}
                      </Text>
                    )}
                  </>
                )}
              </Animated.View>
            ) : (
              <Animated.Text entering={FadeIn} className="text-lg text-gray-500">
                Get ready...
              </Animated.Text>
            )}

            <View className="flex-row gap-2">
              {config.items.map((_, i) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < currentShowIndex ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* RECALL phase */}
        {phase === 'recall' && (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-3xl text-gray-500 text-center mb-1">
                Select all items you saw
              </Text>
              <Text className="text-3xl text-gray-400 text-center mb-4">
                {selectedIds.length} selected
              </Text>

              <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                <View
                  className={`h-full rounded-full ${timer.isWarning ? 'bg-red-400' : 'bg-blue-400'}`}
                  style={{ width: `${100 - timer.progressPercent}%` }}
                />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', gap: 12 }}>
                {ALL_OPTIONS.map(item => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <SelectableOption
                      key={item.id}
                      selected={selected}
                      onPress={() => toggleSelect(item.id)}
                    >
                      {canShowImage(item.image) ? (
                        <>
                          <Image
                            source={{ uri: item.image }}
                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                            resizeMode="cover"
                            onError={() => markImageFailed(item.image)}
                          />
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              paddingVertical: 8,
                              paddingHorizontal: 6,
                              backgroundColor: selected
                                ? 'rgba(37, 99, 235, 0.85)'
                                : 'rgba(17, 24, 39, 0.55)',
                            }}
                          >
                            <Text className="text-lg font-bold text-white text-center">
                              {item.label}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={{ fontSize: 50 }}>{item.emoji}</Text>
                          <Text className={`text-2xl font-medium mt-1 ${selected ? 'text-white' : 'text-gray-600'}`}>
                            {item.label}
                          </Text>
                          {config.showHints && !selected && (
                            <Text className="text-xl text-gray-400">{item.category}</Text>
                          )}
                        </>
                      )}
                    </SelectableOption>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={finishGame}
              disabled={selectedIds.length === 0}
              className={`py-4 rounded-2xl items-center ${selectedIds.length > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <Text className={`font-bold text-xl ${selectedIds.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                Submit Answers
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
