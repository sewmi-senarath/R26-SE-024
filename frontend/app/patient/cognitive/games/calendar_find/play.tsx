import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { useAssessment } from '@/src/context/AssessmentContext';
import { usePersonalizedGameContent } from '@/src/hooks/usePersonalizedGameContent';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { useSoundEffects } from '@/src/hooks/useSoundEffects';
import { CalendarFindConfig, Difficulty, DifficultyProgressUpdate, GameSessionResult } from '@/src/types/games.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useState } from 'react';
import { Dimensions, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

type Phase = 'instruction' | 'play' | 'result';
type Prompt = { id: string; text: string; target: number };
type Cal = { year: number; month: number; today: number; daysInMonth: number; firstWeekday: number; monthName: string };

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildCal(): Cal {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    year,
    month,
    today: now.getDate(),
    daysInMonth: new Date(year, month + 1, 0).getDate(),
    firstWeekday: new Date(year, month, 1).getDay(),
    monthName: now.toLocaleDateString(undefined, { month: 'long' }),
  };
}

function buildPrompts(cfg: CalendarFindConfig, cal: Cal): Prompt[] {
  const { year, month, today, daysInMonth, monthName } = cal;
  const nth = (wd: number, n: number): number | null => {
    let c = 0;
    for (let d = 1; d <= daysInMonth; d += 1) {
      if (new Date(year, month, d).getDay() === wd) {
        c += 1;
        if (c === n) return d;
      }
    }
    return null;
  };
  const last = (wd: number): number | null => {
    for (let d = daysInMonth; d >= 1; d -= 1) {
      if (new Date(year, month, d).getDay() === wd) return d;
    }
    return null;
  };

  const pool: Prompt[] = [];
  const add = (target: number | null, text: string) => {
    if (target && target >= 1 && target <= daysInMonth && !pool.some((p) => p.target === target)) {
      pool.push({ id: `p${pool.length}`, target, text });
    }
  };
  const otherDays = shuffle(
    Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => d !== today),
  );

  if (cfg.relativeReasoning) {
    otherDays.slice(0, 4).forEach((base) => {
      const n = 1 + Math.floor(Math.random() * 4);
      if (base + n <= daysInMonth) add(base + n, `Tap the day ${n} day${n > 1 ? 's' : ''} after the ${ordinal(base)}`);
      else if (base - n >= 1) add(base - n, `Tap the day ${n} day${n > 1 ? 's' : ''} before the ${ordinal(base)}`);
    });
    [1, 5, 6].forEach((wd) => add(last(wd), `Tap the last ${WD[wd]} of ${monthName}`));
    add(nth(3, 2), `Tap the second Wednesday of ${monthName}`);
  } else {
    add(today, "Tap today's date");
    otherDays.slice(0, 3).forEach((d) => add(d, `Tap the ${ordinal(d)} of ${monthName}`));
    add(nth(0, 1), `Tap the first Sunday of ${monthName}`);
    add(nth(1, 1), `Tap the first Monday of ${monthName}`);
    add(last(6), `Tap the last Saturday of ${monthName}`);
  }

  const chosen = shuffle(pool);
  // On easy, lead with "today" so the support cue is used first.
  if (cfg.showTodayHint) {
    const ti = chosen.findIndex((p) => p.target === today);
    if (ti > 0) chosen.unshift(chosen.splice(ti, 1)[0]);
  }
  return chosen.slice(0, cfg.promptCount);
}

export default function CalendarFindGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const router = useRouter();
  const { playSound } = useSoundEffects();
  const saveGameSession = useSaveGameSession();
  const { patientId } = useAssessment();
  const { config: liveConfig, loading } = usePersonalizedGameContent<CalendarFindConfig>(
    'calendar_find',
    difficulty,
    patientId,
  );

  const [phase, setPhase] = useState<Phase>('instruction');
  const [cal, setCal] = useState<Cal | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [tappedDay, setTappedDay] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const current = prompts[currentIndex];

  const finishGame = useCallback(
    (finalScore: number) => {
      if (finalScore === prompts.length) playSound('success');
      else if (finalScore === 0) playSound('error');
      else playSound('click');

      const nextResult: GameSessionResult = {
        gameId: 'calendar_find',
        difficulty,
        score: finalScore,
        maxScore: prompts.length,
        timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        completedAt: new Date().toISOString(),
        correctAnswers: finalScore,
        totalAnswers: prompts.length,
      };
      setResult(nextResult);
      saveGameSession(nextResult).then(setProgress);
      setShowConfetti(true);
      Speech.speak(`You found ${finalScore} out of ${prompts.length}.`);
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('result');
      }, 1100);
    },
    [prompts.length, difficulty, startTime, playSound, saveGameSession],
  );

  const advance = useCallback(
    (scoreNow: number) => {
      if (currentIndex < prompts.length - 1) {
        setCurrentIndex(i => i + 1);
        setTappedDay(null);
        setFeedback(null);
      } else {
        finishGame(scoreNow);
      }
    },
    [currentIndex, prompts.length, finishGame],
  );

  const handleTapDay = (day: number) => {
    if (feedback || !current) return;
    setTappedDay(day);
    const isCorrect = day === current.target;
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) {
      setScore(nextScore);
      setFeedback('correct');
      playSound('success');
      Speech.speak('Correct!');
    } else {
      setFeedback('incorrect');
      playSound('error');
    }
    setTimeout(() => advance(nextScore), 1100);
  };

  const handleSkip = () => {
    if (feedback) return;
    playSound('click');
    Speech.stop();
    advance(score);
  };

  const handleStart = () => {
    playSound('click');
    const c = buildCal();
    setCal(c);
    setPrompts(buildPrompts(liveConfig, c));
    setCurrentIndex(0);
    setScore(0);
    setTappedDay(null);
    setFeedback(null);
    setStartTime(Date.now());
    setPhase('play');
  };

  const handleReset = () => {
    playSound('click');
    Speech.stop();
    setPhase('instruction');
    setCal(null);
    setPrompts([]);
    setCurrentIndex(0);
    setScore(0);
    setTappedDay(null);
    setFeedback(null);
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
        gameId="calendar_find"
        difficulty={difficulty}
        steps={[
          { icon: '📅', text: 'You will see this month on a calendar' },
          { icon: '🔎', text: 'Read each prompt and tap the correct day' },
          { icon: '✅', text: `Answer ${liveConfig.promptCount} prompts correctly` },
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

  if (!cal || !current) return <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} />;

  const boardWidth = Math.min(SCREEN_WIDTH - 32, 360);
  const gap = 6;
  const cellSize = (boardWidth - gap * 6) / 7;
  // Leading blanks + day cells.
  const cells: (number | null)[] = [
    ...Array.from({ length: cal.firstWeekday }, () => null),
    ...Array.from({ length: cal.daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {showConfetti && <ConfettiCannon count={80} origin={{ x: 180, y: 0 }} fadeOut />}
      <GameHeader title="Calendar Find" difficulty={difficulty} timeLeft={null} totalSeconds={null} onBack={handleGoBack} />

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}>
        <View className="flex-row items-center justify-between mb-3" style={{ width: boardWidth }}>
          <Text className="text-sm font-semibold text-gray-700">
            {currentIndex + 1} of {prompts.length}
          </Text>
          <Text className="text-sm font-bold text-yellow-600">{score} correct</Text>
        </View>

        {/* Prompt */}
        <Animated.View key={current.id} entering={ZoomIn.duration(300)} className="bg-white rounded-2xl border border-yellow-100 px-5 py-4 mb-4" style={{ width: boardWidth }}>
          <Text style={{ fontSize: 19, fontWeight: '700', color: '#1f2937', textAlign: 'center' }}>{current.text}</Text>
        </Animated.View>

        <Text className="text-base font-bold text-gray-800 mb-2">{cal.monthName} {cal.year}</Text>

        {/* Weekday header */}
        <View style={{ width: boardWidth, flexDirection: 'row', gap, marginBottom: 4 }}>
          {WD_SHORT.map((w) => (
            <Text key={w} style={{ width: cellSize, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9ca3af' }}>{w}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ width: boardWidth, flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`b${i}`} style={{ width: cellSize, height: cellSize }} />;
            const isTarget = feedback && day === current.target;
            const isWrongTap = feedback === 'incorrect' && day === tappedDay;
            const isTodayHint = liveConfig.showTodayHint && !feedback && day === cal.today;
            return (
              <TouchableOpacity
                key={day}
                activeOpacity={0.7}
                disabled={Boolean(feedback)}
                onPress={() => handleTapDay(day)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isTodayHint ? 2 : 1,
                  borderColor: isTarget ? '#22C55E' : isWrongTap ? '#EF4444' : isTodayHint ? '#EAB308' : '#e5e7eb',
                  backgroundColor: isTarget ? '#DCFCE7' : isWrongTap ? '#FEE2E2' : '#ffffff',
                }}
              >
                <Text style={{ fontSize: cellSize * 0.36, fontWeight: '700', color: isTarget ? '#15803D' : isWrongTap ? '#B91C1C' : '#374151' }}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!feedback && (
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            className="mt-6 flex-row items-center justify-center gap-1.5 py-3"
            accessibilityRole="button"
            accessibilityLabel="Skip this prompt"
          >
            <Text className="text-base font-semibold text-gray-400">Skip</Text>
            <Ionicons name="play-skip-forward-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {feedback && (
          <Animated.View entering={FadeInUp.duration(300)} className={`mt-6 p-3 rounded-xl flex-row items-center justify-center gap-1.5 ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`} style={{ width: boardWidth }}>
            <Ionicons name={feedback === 'correct' ? 'checkmark-circle' : 'close-circle'} size={18} color={feedback === 'correct' ? '#15803D' : '#B91C1C'} />
            <Text className={`font-semibold ${feedback === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
              {feedback === 'correct' ? 'Correct!' : `It was the ${ordinal(current.target)}`}
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
