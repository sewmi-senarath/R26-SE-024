import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getGameContent } from '@/src/constants/gameContent';
import { getRandomPuzzleImage, PuzzleImage } from '@/src/constants/puzzleImages';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { Difficulty, GameSessionResult, PhotoPuzzleConfig } from '@/src/types/games.types';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// CONSTANTS
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 14;
const PUZZLE_SIZE = Math.min(SCREEN_WIDTH - H_PADDING * 2, 340);
const SNAP_THRESHOLD = 60;
const TRAY_PADDING = 10;
const PIECE_GAP = 1;
const PIECE_X_OFFSET = 12; 
const TRAY_PIECE_SCALE = 0.9; // or any value less than 1 for smaller tray pieces

type Phase = 'instruction' | 'playing' | 'result';

interface PuzzlePiece {
  id: number;
  correctCol: number;
  correctRow: number;
  correctPosition: number;
}

// HELPERS
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPieces(gridSize: number): PuzzlePiece[] {
  const pieces: PuzzlePiece[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      pieces.push({
        id: row * gridSize + col,
        correctCol: col,
        correctRow: row,
        correctPosition: row * gridSize + col,
      });
    }
  }
  return shuffle(pieces);
}

// DRAGGABLE PIECE
interface DraggablePieceProps {
  piece: PuzzlePiece;
  cellSize: number;
  image: PuzzleImage;
  puzzleSize: number;
  // All positions below are in the GestureHandlerRootView coordinate space
  // obtained from onLayout (not measureInWindow)
  initX: number;
  initY: number;
  slotPositions: { x: number; y: number }[];
  onSnapped: (pieceId: number, slotIndex: number) => void;
  onUnsnapped: (pieceId: number) => void;
  snappedSlot: number | null;
  isCorrect: boolean;
  scale?: number; // optional, default to 1
}

function DraggablePiece({
  piece,
  cellSize,
  image,
  puzzleSize,
  initX,
  initY,
  slotPositions,
  onSnapped,
  onUnsnapped,
  snappedSlot,
  isCorrect,
  scale = 1,
}: DraggablePieceProps) {
  const tx = useSharedValue(initX);
  const ty = useSharedValue(initY);
  const sc = useSharedValue(1);
  const zi = useSharedValue(10);

  // Spring back to tray when displaced by another piece
  useEffect(() => {
    if (snappedSlot === null) {
      tx.value = withSpring(initX, { damping: 18 });
      ty.value = withSpring(initY, { damping: 18 });
    }
  }, [snappedSlot]);

  // Keep snapped position in sync if slot positions change (re-measure)
  useEffect(() => {
    if (snappedSlot !== null && slotPositions[snappedSlot]) {
      tx.value = withSpring(slotPositions[snappedSlot].x, { damping: 18 });
      ty.value = withSpring(slotPositions[snappedSlot].y, { damping: 18 });
    }
  }, [slotPositions]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      sc.value = withSpring(1.1);
      zi.value = 999;
      if (snappedSlot !== null) {
        runOnJS(onUnsnapped)(piece.id);
      }
    })
    .onUpdate((e) => {
      // e.absoluteX/Y = finger position in screen coords
      // Subtract rootViewOrigin (passed via initX/initY calculation)
      // and half cellSize to centre piece under finger
      tx.value = e.absoluteX - cellSize / 2;
      ty.value = e.absoluteY - cellSize / 2;
    })
    .onEnd((e) => {
      sc.value = withSpring(1);
      zi.value = 10;

      const fingerX = e.absoluteX;
      const fingerY = e.absoluteY;

      let bestSlot = -1;
      let bestDist = SNAP_THRESHOLD;

      slotPositions.forEach((slot, i) => {
        const cx = slot.x + cellSize / 2;
        const cy = slot.y + cellSize / 2;
        const d = Math.sqrt((fingerX - cx) ** 2 + (fingerY - cy) ** 2);
        if (d < bestDist) {
          bestDist = d;
          bestSlot = i;
        }
      });

      if (bestSlot !== -1) {
        tx.value = withSpring(slotPositions[bestSlot].x, { damping: 18 });
        ty.value = withSpring(slotPositions[bestSlot].y, { damping: 18 });
        runOnJS(onSnapped)(piece.id, bestSlot);
      } else {
        tx.value = withSpring(initX, { damping: 18 });
        ty.value = withSpring(initY, { damping: 18 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: cellSize * scale,
    height: cellSize * scale,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: sc.value * scale },
    ],
    zIndex: zi.value,
    borderRadius: 5,
    overflow: 'hidden' as const,
    borderWidth: isCorrect ? 2.5 : 1,
    borderColor: isCorrect ? '#22c55e' : 'rgba(180,180,180,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animStyle}>
        <Image
          source={image.source}
          style={{
            width: puzzleSize,
            height: puzzleSize,
            position: 'absolute',
            left: -(piece.correctCol * cellSize),
            top: -(piece.correctRow * cellSize),
          }}
          resizeMode="cover"
        />
        {isCorrect && (
          <View style={{
            position: 'absolute', top: 3, right: 3,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: '#22c55e',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// MAIN SCREEN
export default function PhotoPuzzleGame() {
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const config = getGameContent<PhotoPuzzleConfig>('photo_puzzle', difficulty);
  const saveGameSession = useSaveGameSession();

  const [phase, setPhase] = useState<Phase>('instruction');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [puzzleImage, setPuzzleImage] = useState<PuzzleImage | null>(null);
  const [snappedMap, setSnappedMap] = useState<Record<number, number | null>>({});

  // ── Key insight: we store positions in SCREEN (absoluteX/Y) space ──
  // onLayout gives position relative to parent. We accumulate the
  // root view's screen origin once, then add it to all onLayout values.
  const [rootOrigin, setRootOrigin] = useState({ x: 0, y: 0 });
  const [boardOrigin, setBoardOrigin] = useState({ x: 0, y: 0 });
  const [trayOrigin, setTrayOrigin] = useState({ x: 0, y: 0 });
  const [layoutReady, setLayoutReady] = useState(false);

  const rootRef = useRef<View>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(config.timeLimitSeconds);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const celebratedRef = useRef(false);
  const warningSpokenRef = useRef(false);

  const cellSize = Math.floor(PUZZLE_SIZE / config.gridSize);
  const pieceCount = config.gridSize * config.gridSize;

  // ── Measure root origin once using measureInWindow on root only ──
  // Root view is full screen so its origin = status bar offset only
  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      setRootOrigin({ x, y });
    });
  }, []);

  // ── Build slot positions in screen space ──────────────────
  // boardOrigin is relative to root. Add rootOrigin to get screen coords.
  const slotPositions = Array(pieceCount).fill(null).map((_, i) => ({
    x: rootOrigin.x + boardOrigin.x + (i % config.gridSize) * cellSize - PIECE_X_OFFSET, // <-- shift left
    y: rootOrigin.y + boardOrigin.y + Math.floor(i / config.gridSize) * cellSize,
  }));

  // ── Build tray piece start positions in screen space ──────
  const trayStartPositions = Array(pieceCount).fill(null).map((_, i) => {
    const col = i % config.gridSize;
    const row = Math.floor(i / config.gridSize);
    return {
      x: rootOrigin.x + trayOrigin.x + TRAY_PADDING + col * (cellSize + PIECE_GAP) - PIECE_X_OFFSET, // <-- shift left
      y: rootOrigin.y + trayOrigin.y + TRAY_PADDING + 24 + row * (cellSize + PIECE_GAP),
    };
  });

  // ── Check all positions are ready ─────────────────────────
  useEffect(() => {
    if (
      boardOrigin.x !== 0 &&
      trayOrigin.x !== 0 &&
      phase === 'playing'
    ) {
      setLayoutReady(true);
    }
  }, [boardOrigin, trayOrigin, rootOrigin, phase]);

  // ── Finish ────────────────────────────────────────────────
  const finishGame = useCallback(() => {
    const correct = pieces.filter(p => {
      const s = snappedMap[p.id];
      return s !== null && s !== undefined && s === p.correctPosition;
    }).length;
    const nextResult: GameSessionResult = {
      gameId: 'photo_puzzle',
      difficulty,
      score: correct,
      maxScore: pieceCount,
      timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: pieceCount,
    };
    setResult(nextResult);
    void saveGameSession(nextResult);
    Speech.speak(`You solved ${correct} of ${pieceCount} pieces.`);
    setPhase('result');
  }, [pieces, snappedMap, pieceCount, startTime, difficulty, saveGameSession]);

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || config.timeLimitSeconds === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Correct count ─────────────────────────────────────────
  const correctCount = pieces.filter(p => {
    const s = snappedMap[p.id];
    return s !== null && s !== undefined && s === p.correctPosition;
  }).length;

  // ── Win check ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || pieces.length === 0) return;
    if (correctCount === pieceCount && !celebratedRef.current) {
      celebratedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setShowConfetti(true);
      Speech.speak('Wonderful! Puzzle completed.');
      setTimeout(() => {
        setShowConfetti(false);
        finishGame();
      }, 1200);
    }
  }, [phase, pieces.length, correctCount, pieceCount, finishGame]);

  // Speak low-time warning once
  useEffect(() => {
    if (phase !== 'playing' || timeLeft === null) return;
    if (timeLeft <= 15 && !warningSpokenRef.current) {
      warningSpokenRef.current = true;
      Speech.speak('Fifteen seconds left. Keep going.');
    }
  }, [phase, timeLeft]);

  // ── Start ─────────────────────────────────────────────────
  const handleStart = () => {
    setPieces(buildPieces(config.gridSize));
    setSnappedMap({});
    setTimeLeft(config.timeLimitSeconds);
    setStartTime(Date.now());
    setPuzzleImage(getRandomPuzzleImage());
    setLayoutReady(false);
    setBoardOrigin({ x: 0, y: 0 });
    setTrayOrigin({ x: 0, y: 0 });
    setShowConfetti(false);
    celebratedRef.current = false;
    warningSpokenRef.current = false;
    Speech.speak('Drag each piece to the matching spot. Take your time.');
    setPhase('playing');
  };

  // ── Snap / unsnap ─────────────────────────────────────────
  const handleSnapped = useCallback((pieceId: number, slotIndex: number) => {
    const moved = pieces.find(p => p.id === pieceId);
    if (moved?.correctPosition === slotIndex) {
      Speech.speak('Great placement.');
    }
    setSnappedMap(prev => {
      const updated: Record<number, number | null> = {};
      Object.entries(prev).forEach(([pid, slot]) => {
        updated[Number(pid)] = slot === slotIndex ? null : slot;
      });
      updated[pieceId] = slotIndex;
      return updated;
    });
  }, [pieces]);

  const handleUnsnapped = useCallback((pieceId: number) => {
    setSnappedMap(prev => ({ ...prev, [pieceId]: null }));
  }, []);

  const handleReset = () => {
    setPhase('instruction');
    setPieces([]);
    setSnappedMap({});
    setResult(null);
    setLayoutReady(false);
    setShowConfetti(false);
    celebratedRef.current = false;
    warningSpokenRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // RENDER
  if (phase === 'instruction') {
    return (
      <InstructionScreen
        gameId="photo_puzzle"
        difficulty={difficulty}
        steps={[
          { icon: '✋', text: 'Drag each piece from the bottom tray up onto the puzzle board' },
          { icon: '🎯', text: 'Place each piece in the correct position' },
          ...(config.timeLimitSeconds
            ? [{ icon: '⏱️', text: `Complete within ${config.timeLimitSeconds} seconds` }]
            : [{ icon: '♾️', text: 'No time limit - take your time' }]
          ),
        ]}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} onPlayAgain={handleReset} />;
  }

  const isWarning = timeLeft !== null && timeLeft <= 15;

  // Exact tray height: label(24) + rows of pieces + gaps + padding*2
  const trayRows = Math.ceil(pieceCount / config.gridSize);
  const TRAY_HEIGHT = 24 + trayRows * cellSize + (trayRows - 1) * PIECE_GAP + TRAY_PADDING * 2;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showConfetti && (
        <ConfettiCannon
          count={120}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          fadeOut
          fallSpeed={2600}
        />
      )}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: '#f9fafb',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}
        bounces={false}
      >
        <View style={{ paddingHorizontal: H_PADDING, flex: 1 }}>
          <GameHeader
            title="Photo Puzzle"
            difficulty={difficulty}
            timeLeft={timeLeft}
          />

          {/* Stats row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              {correctCount} / {pieceCount} placed correctly
            </Text>
            {isWarning && timeLeft !== null && (
              <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '700' }}>
                ⚠ {timeLeft}s left!
              </Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={{
            height: 5,
            backgroundColor: '#e5e7eb',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 12,
          }}>
            <View style={{
              height: '100%',
              borderRadius: 999,
              backgroundColor: correctCount === pieceCount ? '#22c55e' : '#60a5fa',
              width: `${(correctCount / pieceCount) * 100}%`,
            }} />
          </View>

          {/* ── Board ──────────────────────────────────── */}
          <View
            onLayout={(e: LayoutChangeEvent) => {
              // e.nativeEvent.layout is relative to the paddingHorizontal View
              // We need it relative to rootRef, so add H_PADDING
              setBoardOrigin({
                x: H_PADDING + e.nativeEvent.layout.x,
                y: e.nativeEvent.layout.y,
              });
            }}
            style={{
              width: PUZZLE_SIZE,
              height: PUZZLE_SIZE,
              alignSelf: 'center',
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#d1d5db',
              backgroundColor: '#e9ecef',
              overflow: 'hidden',
              marginBottom: 14,
              position: 'relative',
            }}
          >
            {/* Ghost guide */}
            {config.showGhostGuide && puzzleImage && (
              <Image
                source={puzzleImage.source}
                style={{
                  position: 'absolute',
                  width: PUZZLE_SIZE,
                  height: PUZZLE_SIZE,
                  opacity: 0.18,
                }}
                resizeMode="cover"
              />
            )}

            {/* Slot grid */}
            {Array(pieceCount).fill(null).map((_, i) => {
              const col = i % config.gridSize;
              const row = Math.floor(i / config.gridSize);
              const occupied = Object.values(snappedMap).includes(i);
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: col * cellSize,
                    top: row * cellSize,
                    width: cellSize,
                    height: cellSize,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: occupied ? 'transparent' : '#b0b8c1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!occupied && (
                    <Text style={{ color: '#ced4da', fontSize: 11 }}>{i + 1}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Tray ───────────────────────────────────── */}
          <View
            onLayout={(e: LayoutChangeEvent) => {
              setTrayOrigin({
                x: H_PADDING + e.nativeEvent.layout.x,
                y: e.nativeEvent.layout.y,
              });
            }}
            style={{
              width: PUZZLE_SIZE,
              alignSelf: 'center',
              // Exact calculated height — no overflow, no clipping
              height: TRAY_HEIGHT,
              backgroundColor: '#ffffff',
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: '#e5e7eb',
              marginBottom: 12,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Text style={{
              fontSize: 10,
              color: '#adb5bd',
              textAlign: 'center',
              height: 24,
              lineHeight: 24,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              Drag pieces onto the board ↑
            </Text>

            {/* Tray slot outlines — visual placeholders */}
            {Array(pieceCount).fill(null).map((_, i) => {
              const col = i % config.gridSize;
              const row = Math.floor(i / config.gridSize);
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: TRAY_PADDING + col * (cellSize * TRAY_PIECE_SCALE + PIECE_GAP),
                    top: 24 + TRAY_PADDING + row * (cellSize * TRAY_PIECE_SCALE + PIECE_GAP),
                    width: cellSize * TRAY_PIECE_SCALE,
                    height: cellSize * TRAY_PIECE_SCALE,
                  }}
                />
              );
            })}
          </View>

          {/* Reshuffle — always visible below tray */}
          <TouchableOpacity
            onPress={() => {
              setPieces(prev => shuffle([...prev]));
              setSnappedMap({});
              Speech.speak('Tray reshuffled.');
            }}
            style={{
              alignSelf: 'center',
              borderWidth: 1,
              borderColor: '#dee2e6',
              borderRadius: 10,
              paddingVertical: 8,
              paddingHorizontal: 24,
              backgroundColor: '#fff',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>Reshuffle Tray</Text>
          </TouchableOpacity>

        </View>

        {/* ── Full-screen piece overlay ────────────────── */}
        {/* Pieces live here so their coordinates = screen coordinates */}
        {/* pointerEvents="box-none" so touches pass through to buttons */}
        {layoutReady && puzzleImage && (
          <View
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {pieces.map((piece, index) => {
              const start = trayStartPositions[index] ?? { x: 0, y: 0 };
              const snappedSlot = snappedMap[piece.id] ?? null;
              const isCorrect =
                snappedSlot !== null && snappedSlot === piece.correctPosition;

              return (
                <DraggablePiece
                  key={piece.id}
                  piece={piece}
                  cellSize={cellSize}
                  image={puzzleImage!}
                  puzzleSize={PUZZLE_SIZE}
                  initX={start.x}
                  initY={start.y}
                  slotPositions={slotPositions}
                  onSnapped={handleSnapped}
                  onUnsnapped={handleUnsnapped}
                  snappedSlot={snappedSlot}
                  isCorrect={isCorrect}
                  scale={snappedSlot === null ? TRAY_PIECE_SCALE : 1}
                />
              );
            })}
          </View>
        )}

      </ScrollView>
    </GestureHandlerRootView>
  );
}
