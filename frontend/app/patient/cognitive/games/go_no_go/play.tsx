import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, GoNoGoConfig, SequenceItem } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'ready' | 'run' | 'result';
type Stimulus = { key: string; item: SequenceItem; isTarget: boolean };

export default function GoNoGoGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<GoNoGoConfig>(
    'go_no_go',
    difficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<GoNoGoConfig | null>(null);
  const config = frozenConfig ?? liveConfig;
  const target = config.items[0];

  const [phase, setPhase] = useState<Phase>('instruction');
  const [sequence, setSequence] = useState<Stimulus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readyLeft, setReadyLeft] = useState(3);
  const [tapFlash, setTapFlash] = useState<'hit' | 'wrong' | null>(null);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const respondedRef = useRef(false);
  const shownAtRef = useRef(0);
  const startTimeRef = useRef(0);
  const finishedRef = useRef(false);
  const statsRef = useRef({ hits: 0, falseAlarms: 0, rtSum: 0, rtCount: 0 });

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const markImageFailed = useCallback((uri?: string) => {
    if (!uri) return;
    setFailedImages(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  }, []);
  const canShowImage = (uri?: string) => !!uri && !failedImages.has(uri);

  const finishGame = useCallback(() => {
    if (finishedRef.current) return; // run exactly once
    finishedRef.current = true;
    const { hits, falseAlarms } = statsRef.current;
    const score = Math.max(0, hits - falseAlarms);

    if (score === config.targetCount) playSound('success');
    else if (score === 0) playSound('error');
    else playSound('click');

    const nextResult: GameSessionResult = {
      gameId: 'go_no_go',
      difficulty,
      score,
      maxScore: config.targetCount,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: hits,
      totalAnswers: config.targetCount,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    setShowConfetti(true);
    Speech.speak(`You scored ${score} out of ${config.targetCount}.`);
    setTimeout(() => {
      setShowConfetti(false);
      setPhase('result');
    }, 1100);
  }, [config.targetCount, difficulty, playSound, saveGameSession]);

  // Ready countdown, then start the stream.
  useEffect(() => {
    if (phase !== 'ready') return;
    if (readyLeft <= 0) {
      startTimeRef.current = Date.now();
      statsRef.current = { hits: 0, falseAlarms: 0, rtSum: 0, rtCount: 0 };
      finishedRef.current = false;
      setCurrentIndex(0);
      setPhase('run');
      return;
    }
    const t = setTimeout(() => setReadyLeft(n => n - 1), 800);
    return () => clearTimeout(t);
  }, [phase, readyLeft]);

  // Present each stimulus for intervalMs, then advance (resolving a missed tap).
  useEffect(() => {
    if (phase !== 'run') return;
    if (currentIndex >= sequence.length) {
      finishGame();
      return;
    }
    respondedRef.current = false;
    shownAtRef.current = Date.now();
    const t = setTimeout(() => setCurrentIndex(i => i + 1), config.intervalMs);
    return () => clearTimeout(t);
  }, [phase, currentIndex, sequence.length, config.intervalMs, finishGame]);

  const handleTap = () => {
    if (phase !== 'run' || respondedRef.current) return;
    const stim = sequence[currentIndex];
    if (!stim) return;
    respondedRef.current = true;
    if (stim.isTarget) {
      statsRef.current.hits += 1;
      statsRef.current.rtSum += Date.now() - shownAtRef.current;
      statsRef.current.rtCount += 1;
      setTapFlash('hit');
      playSound('success');
    } else {
      statsRef.current.falseAlarms += 1;
      setTapFlash('wrong');
      playSound('error');
    }
    setTimeout(() => setTapFlash(null), 180);
  };

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    const lures = frozen.items.slice(1);
    const seq: Stimulus[] = [];
    for (let i = 0; i < frozen.targetCount; i += 1) {
      seq.push({ key: `t${i}`, item: frozen.items[0], isTarget: true });
    }
    for (let i = 0; i < frozen.lureCount; i += 1) {
      const lure = lures[Math.floor(Math.random() * lures.length)] ?? frozen.items[0];
      seq.push({ key: `l${i}`, item: lure, isTarget: false });
    }
    for (let i = seq.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    setSequence(seq);
    setReadyLeft(3);
    setPhase('ready');
    Speech.speak(`Tap only when you see the ${frozen.items[0].label}.`);
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    setFrozenConfig(null);
    setPhase('instruction');
    setSequence([]);
    setCurrentIndex(0);
    setTapFlash(null);
    finishedRef.current = false;
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
        gameId="go_no_go"
        difficulty={difficulty}
        steps={[
          { icon: '🎯', text: 'You will be given one target picture to watch for' },
          { icon: '👆', text: 'Tap the screen ONLY when the target appears' },
          { icon: '✋', text: 'Hold back - do not tap for any other picture' },
        ]}
        onStart={handleStart}
        onBack={handleGoBack}
        startDisabled={loading}
        startLabel={loading ? 'Preparing your game…' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} onBack={handleGoBack} />;
  }

  const renderToken = (item: SequenceItem, size: number) =>
    canShowImage(item.image) ? (
      <Image source={{ uri: item.image }} style={{ width: size, height: size, borderRadius: 20 }} resizeMode="cover" onError={() => markImageFailed(item.image)} />
    ) : (
      <Text style={{ fontSize: size * 0.6 }}>{item.emoji}</Text>
    );

  const current = sequence[currentIndex];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={90} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader title="Tap the Target" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      {/* Target reminder */}
      {target && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Tap only for</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 }}>
            <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>{renderToken(target, 34)}</View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#047857' }}>{target.label}</Text>
          </View>
        </View>
      )}

      {phase === 'ready' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Animated.View entering={ZoomIn.duration(300)} className="w-28 h-28 rounded-full bg-emerald-100 items-center justify-center">
            <Text style={{ fontSize: 46, fontWeight: '800', color: '#059669' }}>{readyLeft > 0 ? readyLeft : 'Go!'}</Text>
          </Animated.View>
          <Text className="text-base text-gray-500">Get ready…</Text>
        </View>
      )}

      {phase === 'run' && (
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-sm font-semibold text-gray-400 mb-6">
            {currentIndex + 1} of {sequence.length}
          </Text>
          {current && (
            <Animated.View
              key={currentIndex}
              entering={ZoomIn.duration(150)}
              style={{
                width: 200,
                height: 200,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tapFlash === 'hit' ? '#DCFCE7' : tapFlash === 'wrong' ? '#FEE2E2' : '#ffffff',
                borderWidth: 3,
                borderColor: tapFlash === 'hit' ? '#22C55E' : tapFlash === 'wrong' ? '#EF4444' : '#e5e7eb',
              }}
            >
              {renderToken(current.item, 200)}
            </Animated.View>
          )}
          <View style={{ marginTop: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="hand-left-outline" size={20} color="#059669" />
            <Text className="text-base font-bold text-emerald-600">Tap here for the target</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
