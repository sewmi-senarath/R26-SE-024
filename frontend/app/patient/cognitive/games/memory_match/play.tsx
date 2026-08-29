import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, MemoryMatchConfig, SequenceItem } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Phase = 'instruction' | 'peek' | 'play' | 'result';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Card = { key: string; pairId: string; item: SequenceItem };

function buildDeck(items: SequenceItem[]): Card[] {
  const cards: Card[] = [];
  items.forEach(item => {
    cards.push({ key: `${item.id}-a`, pairId: item.id, item });
    cards.push({ key: `${item.id}-b`, pairId: item.id, item });
  });
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function MatchCard({
  card,
  faceUp,
  matched,
  size,
  disabled,
  onPress,
  onImageError,
  showImage,
}: {
  card: Card;
  faceUp: boolean;
  matched: boolean;
  size: number;
  disabled: boolean;
  onPress: () => void;
  onImageError: () => void;
  showImage: boolean;
}) {
  const progress = useSharedValue(faceUp ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(faceUp ? 1 : 0, { duration: 260 });
  }, [faceUp, progress]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${180 - progress.value * 180}deg` }],
    opacity: progress.value >= 0.5 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${progress.value * 180}deg` }],
    opacity: progress.value >= 0.5 ? 0 : 1,
  }));

  const faceBase = {
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    backfaceVisibility: 'hidden' as const,
  };

  return (
    <TouchableOpacity activeOpacity={0.9} disabled={disabled} onPress={onPress} style={{ width: size, height: size }}>
      {/* Back face (face-down) */}
      <Animated.View style={[faceBase, backStyle, { backgroundColor: '#EC4899', borderWidth: 2, borderColor: '#DB2777' }]}>
        <Ionicons name="help" size={size * 0.4} color="#ffffff" />
      </Animated.View>

      {/* Front face (revealed) */}
      <Animated.View
        style={[faceBase, frontStyle, {
          backgroundColor: '#ffffff',
          borderWidth: 2,
          borderColor: matched ? '#22C55E' : '#F9A8D4',
          opacity: matched ? 0.7 : 1,
        }]}
      >
        {showImage && card.item.image ? (
          <Image source={{ uri: card.item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={onImageError} />
        ) : (
          <Text style={{ fontSize: size * 0.42 }}>{card.item.emoji}</Text>
        )}
        {matched && (
          <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#22C55E', borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MemoryMatchGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<MemoryMatchConfig>(
    'memory_match',
    difficulty,
    patientId,
  );

  const [frozenConfig, setFrozenConfig] = useState<MemoryMatchConfig | null>(null);
  const config = frozenConfig ?? liveConfig;

  const [phase, setPhase] = useState<Phase>('instruction');
  const [deck, setDeck] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
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

  // Peek phase: show all cards, then flip them down to begin play.
  useEffect(() => {
    if (phase !== 'peek') return;
    const t = setTimeout(() => setPhase('play'), config.peekMs);
    return () => clearTimeout(t);
  }, [phase, config.peekMs]);

  const finishGame = useCallback(
    (pairsFound: number) => {
      if (pairsFound === config.pairCount) playSound('success');
      else if (pairsFound === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'memory_match',
        difficulty,
        score: pairsFound,
        maxScore: config.pairCount,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: pairsFound,
        totalAnswers: config.pairCount,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You matched ${pairsFound} out of ${config.pairCount} pairs.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [config.pairCount, difficulty, startTime, playSound, saveGameSession],
  );

  const handleCardPress = (index: number) => {
    if (phase !== 'play' || busy) return;
    const card = deck[index];
    if (matched.has(card.pairId) || selected.includes(index)) return;
    if (selected.length >= 2) return;

    playSound('click');
    const nextSelected = [...selected, index];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = nextSelected;
      const isMatch = deck[a].pairId === deck[b].pairId;

      if (isMatch) {
        const nextMatched = new Set(matched).add(deck[a].pairId);
        setMatched(nextMatched);
        setSelected([]);
        playSound('success');
        if (nextMatched.size === config.pairCount) {
          setTimeout(() => finishGame(nextMatched.size), 500);
        }
      } else {
        setBusy(true);
        setTimeout(() => {
          setSelected([]);
          setBusy(false);
          // Out of moves without clearing the board → end with what was matched.
          if (config.moveLimit && nextMoves >= config.moveLimit && matched.size < config.pairCount) {
            finishGame(matched.size);
          }
        }, 850);
      }
    }
  };

  const handleStart = () => {
    playSound('click');
    const frozen = liveConfig;
    setFrozenConfig(frozen);
    setDeck(buildDeck(frozen.items));
    setSelected([]);
    setMatched(new Set());
    setMoves(0);
    setBusy(false);
    setStartTime(Date.now());
    setPhase('peek');
    Speech.speak('Look at the cards and remember where each one is.');
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    setFrozenConfig(null);
    setPhase('instruction');
    setDeck([]);
    setSelected([]);
    setMatched(new Set());
    setMoves(0);
    setBusy(false);
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
        gameId="memory_match"
        difficulty={difficulty}
        steps={[
          { icon: '👀', text: `First, look at all ${config.pairCount * 2} cards for a few seconds` },
          { icon: '🃏', text: 'Then flip two cards to find a matching pair' },
          { icon: '✅', text: `Match all ${config.pairCount} pairs to clear the board` },
          ...(config.moveLimit ? [{ icon: '🎯', text: `You have ${config.moveLimit} flips - use them wisely` }] : []),
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
      <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} onBack={handleGoBack} />
    );
  }

  const boardWidth = Math.min(SCREEN_WIDTH - 40, 380);
  const gap = 10;
  const cardSize = (boardWidth - gap * (config.columns - 1)) / config.columns;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={90} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader title="Memory Match" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Text className="text-sm font-bold text-pink-600">
            {matched.size} / {config.pairCount} pairs
          </Text>
          <Text className="text-sm font-semibold text-gray-500">
            {config.moveLimit ? `${Math.max(0, config.moveLimit - moves)} flips left` : `${moves} flips`}
          </Text>
        </View>

        {phase === 'peek' && (
          <Text className="text-sm text-gray-400">Remember where the cards are…</Text>
        )}

        <View style={{ width: boardWidth, flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center' }}>
          {deck.map((card, index) => {
            const isMatched = matched.has(card.pairId);
            const faceUp = phase === 'peek' || isMatched || selected.includes(index);
            return (
              <MatchCard
                key={card.key}
                card={card}
                faceUp={faceUp}
                matched={isMatched}
                size={cardSize}
                disabled={phase !== 'play' || busy}
                onPress={() => handleCardPress(index)}
                onImageError={() => markImageFailed(card.item.image)}
                showImage={canShowImage(card.item.image)}
              />
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
