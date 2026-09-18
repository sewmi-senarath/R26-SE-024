import { GameHeader } from '@/src/components/patient/cognitive/components/games/shared/GameHeader';
import { GameResultScreen } from '@/src/components/patient/cognitive/components/games/shared/GameResultScreen';
import { InstructionScreen } from '@/src/components/patient/cognitive/components/games/shared/InstructionScreen';
import { getMePhotos, getPatientPhotos } from '@/src/api/authApi';
import { useAssessment } from '@/src/context/AssessmentContext';
import { getGameContent } from '@/src/constants/gameContent';
import {
  buildMixedPuzzleImagePool,
  buildPatientPuzzleImages,
  getRandomPuzzleImageFromPool,
  MOCK_PUZZLE_IMAGES,
  PuzzleImage,
} from '@/src/constants/puzzleImages';
import { useSaveGameSession } from '@/src/hooks/useSaveGameSession';
import { Difficulty, DifficultyProgressUpdate, GameSessionResult, PhotoPuzzleConfig } from '@/src/types/games.types';
import { buildPuzzleSlotPositions, buildPuzzleTrayPositions } from '@/src/utils/photoPuzzleLayout';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  ScrollView,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// CONSTANTS
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 14;
const PUZZLE_SIZE = Math.min(SCREEN_WIDTH - H_PADDING * 2, 340);
const SNAP_THRESHOLD = 60;
const TRAY_PADDING = 10;
const PIECE_GAP = 1;
const TRAY_PIECE_SCALE = 0.9; // or any value less than 1 for smaller tray pieces
// Smooth, non-bouncy glide for snapping pieces into place - a plain timing
// curve so there is no spring overshoot/bounce at all.
const SNAP_TIMING = { duration: 180, easing: Easing.out(Easing.cubic) };

type Phase = 'instruction' | 'playing' | 'result';

interface PuzzlePiece {
  id: number;
  correctCol: number;
  correctRow: number;
  correctPosition: number;
}

type PatientProfilePhoto = {
  uri: string;
  label?: string;
  category?: PuzzleImage['category'];
};

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

function getPatientProfilePhotos(user: any): PatientProfilePhoto[] {
  const favoritePhotos = Array.isArray(user?.favoritePhotos)
    ? user.favoritePhotos.map((uri: string, index: number) => ({
        uri,
        label: `Favorite Photo ${index + 1}`,
        category: 'family' as const,
      }))
    : [];

  const familyPhotos = Array.isArray(user?.familyMembers)
    ? user.familyMembers
        .filter((member: any) => typeof member?.photo === 'string' && member.photo.trim())
        .map((member: any, index: number) => ({
          uri: member.photo,
          label: member.name || `Family Photo ${index + 1}`,
          category: 'family' as const,
        }))
    : [];

  return [...favoritePhotos, ...familyPhotos];
}

// DRAGGABLE PIECE
interface DraggablePieceProps {
  piece: PuzzlePiece;
  cellSize: number;
  image: PuzzleImage;
  puzzleSize: number;
  // All positions below are local to the shared ScrollView content parent.
  initX: number;
  initY: number;
  slotPositions: { x: number; y: number }[];
  onSnapped: (pieceId: number, slotIndex: number) => void;
  onUnsnapped: (pieceId: number) => void;
  onDragStateChange: (dragging: boolean) => void;
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
  onDragStateChange,
  snappedSlot,
  isCorrect,
  scale = 1,
}: DraggablePieceProps) {
  const tx = useSharedValue(initX);
  const ty = useSharedValue(initY);
  const sc = useSharedValue(1);
  const zi = useSharedValue(10);
  const dragStartX = useSharedValue(initX);
  const dragStartY = useSharedValue(initY);

  // Spring back to tray when displaced by another piece
  useEffect(() => {
    if (snappedSlot === null) {
      tx.value = withTiming(initX, SNAP_TIMING);
      ty.value = withTiming(initY, SNAP_TIMING);
    }
  }, [initX, initY, snappedSlot, tx, ty]);

  // Keep snapped position in sync if slot positions change (re-measure)
  useEffect(() => {
    if (snappedSlot !== null && slotPositions[snappedSlot]) {
      tx.value = withTiming(slotPositions[snappedSlot].x, SNAP_TIMING);
      ty.value = withTiming(slotPositions[snappedSlot].y, SNAP_TIMING);
    }
  }, [slotPositions, snappedSlot, tx, ty]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragStartX.value = tx.value;
      dragStartY.value = ty.value;
      sc.value = withTiming(1.08, { duration: 120 });
      zi.value = 999;
      runOnJS(onDragStateChange)(true);
      if (snappedSlot !== null) {
        runOnJS(onUnsnapped)(piece.id);
      }
    })
    .onUpdate((e) => {
      // The piece, board, and tray share the same scroll-content coordinate
      // space, so gesture translation remains correct at every scroll offset.
      tx.value = dragStartX.value + e.translationX;
      ty.value = dragStartY.value + e.translationY;
    })
    .onEnd(() => {
      sc.value = withTiming(1, { duration: 120 });
      zi.value = 10;

      const pieceCenterX = tx.value + (cellSize * scale) / 2;
      const pieceCenterY = ty.value + (cellSize * scale) / 2;

      let bestSlot = -1;
      let bestDist = SNAP_THRESHOLD;

      slotPositions.forEach((slot, i) => {
        const cx = slot.x + cellSize / 2;
        const cy = slot.y + cellSize / 2;
        const d = Math.sqrt((pieceCenterX - cx) ** 2 + (pieceCenterY - cy) ** 2);
        if (d < bestDist) {
          bestDist = d;
          bestSlot = i;
        }
      });

      if (bestSlot !== -1) {
        tx.value = withTiming(slotPositions[bestSlot].x, SNAP_TIMING);
        ty.value = withTiming(slotPositions[bestSlot].y, SNAP_TIMING);
        runOnJS(onSnapped)(piece.id, bestSlot);
      } else {
        tx.value = withTiming(initX, SNAP_TIMING);
        ty.value = withTiming(initY, SNAP_TIMING);
      }
    })
    .onFinalize(() => {
      runOnJS(onDragStateChange)(false);
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
  const { difficulty: routeDifficulty = 'easy' } = useLocalSearchParams<{ difficulty: Difficulty }>();
  const [difficulty, setDifficulty] = useState<Difficulty>(routeDifficulty);
  const config = getGameContent<PhotoPuzzleConfig>('photo_puzzle', difficulty);
  const saveGameSession = useSaveGameSession();
  const { patientId, isLoadingSession } = useAssessment();

  const [phase, setPhase] = useState<Phase>('instruction');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [puzzleImage, setPuzzleImage] = useState<PuzzleImage | null>(null);
  const [puzzleImagePool, setPuzzleImagePool] = useState<PuzzleImage[]>([]);
  const [isLoadingPuzzleImages, setIsLoadingPuzzleImages] = useState(true);
  const [hasPersonalPuzzleImages, setHasPersonalPuzzleImages] = useState(false);
  const [snappedMap, setSnappedMap] = useState<Record<number, number | null>>({});

  const [boardOrigin, setBoardOrigin] = useState<{ x: number; y: number } | null>(null);
  const [trayOrigin, setTrayOrigin] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPiece, setIsDraggingPiece] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number | null>(config.timeLimitSeconds);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<GameSessionResult | null>(null);
  const [progress, setProgress] = useState<DifficultyProgressUpdate | null>(null);
  const piecesRef = useRef<PuzzlePiece[]>([]);
  const snappedMapRef = useRef<Record<number, number | null>>({});
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReferencePhoto, setShowReferencePhoto] = useState(false);
  const referencePhotoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebratedRef = useRef(false);
  const warningSpokenRef = useRef(false);

  const cellSize = Math.floor(PUZZLE_SIZE / config.gridSize);
  const pieceCount = config.gridSize * config.gridSize;
  const canShowReferencePhoto = difficulty === 'medium' || difficulty === 'hard';

  const calculateCorrectCount = useCallback(
    (currentPieces: PuzzlePiece[], currentSnappedMap: Record<number, number | null>) =>
      currentPieces.filter(p => {
        const s = currentSnappedMap[p.id];
        return s !== null && s !== undefined && s === p.correctPosition;
      }).length,
    [],
  );

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  useEffect(() => {
    snappedMapRef.current = snappedMap;
  }, [snappedMap]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    let cancelled = false;

    const loadPuzzleImages = async () => {
      if (isLoadingSession) {
        setIsLoadingPuzzleImages(true);
        return;
      }

      setIsLoadingPuzzleImages(true);
      const response = patientId ? await getPatientPhotos(patientId) : await getMePhotos();
      const photos = response?.success ? response.data?.photos : null;
      const patientPhotos = buildPatientPuzzleImages(getPatientProfilePhotos(photos));
      const mixedPool = buildMixedPuzzleImagePool(patientPhotos);

      if (!cancelled) {
        setHasPersonalPuzzleImages(patientPhotos.length > 0);
        setPuzzleImagePool(mixedPool);
        setIsLoadingPuzzleImages(false);
      }
    };

    loadPuzzleImages().catch(() => {
      if (!cancelled) {
        setHasPersonalPuzzleImages(false);
        setPuzzleImagePool(MOCK_PUZZLE_IMAGES);
        setIsLoadingPuzzleImages(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, patientId]);

  // ── Build slot positions in the shared content space ─────
  const slotPositions = useMemo(
    () => buildPuzzleSlotPositions(boardOrigin, pieceCount, config.gridSize, cellSize),
    [boardOrigin, cellSize, config.gridSize, pieceCount],
  );

  // ── Build tray piece starts in the shared content space ───
  const trayStartPositions = useMemo(
    () =>
      buildPuzzleTrayPositions(
        trayOrigin,
        pieceCount,
        config.gridSize,
        cellSize,
        TRAY_PIECE_SCALE,
        TRAY_PADDING,
        24,
        PIECE_GAP,
      ),
    [cellSize, config.gridSize, pieceCount, trayOrigin],
  );

  const handleBoardLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y } = event.nativeEvent.layout;
    setBoardOrigin({ x, y });
  }, []);

  const handleTrayLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y } = event.nativeEvent.layout;
    setTrayOrigin({ x, y });
  }, []);

  const layoutReady = phase === 'playing' && boardOrigin !== null && trayOrigin !== null;

  // ── Finish ────────────────────────────────────────────────
  const finishGame = useCallback(() => {
    const correct = calculateCorrectCount(piecesRef.current, snappedMapRef.current);
    const nextResult: GameSessionResult = {
      gameId: 'photo_puzzle',
      difficulty,
      score: correct,
      maxScore: pieceCount,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      completedAt: new Date().toISOString(),
      correctAnswers: correct,
      totalAnswers: pieceCount,
    };
    setResult(nextResult);
    saveGameSession(nextResult).then(setProgress);
    Speech.speak(`You solved ${correct} of ${pieceCount} pieces.`);
    setPhase('result');
  }, [calculateCorrectCount, pieceCount, difficulty, saveGameSession]);

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
  const correctCount = calculateCorrectCount(pieces, snappedMap);

  // ── Win check ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || pieces.length === 0) return;
    if (correctCount === pieceCount && !celebratedRef.current) {
      celebratedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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

  useEffect(() => {
    return () => {
      if (referencePhotoTimerRef.current) {
        clearTimeout(referencePhotoTimerRef.current);
      }
    };
  }, []);

  // ── Start ─────────────────────────────────────────────────
  const handleStart = () => {
    if (isLoadingSession || isLoadingPuzzleImages) {
      Speech.speak('Preparing your photos. Please wait a moment.');
      return;
    }

    const startedAt = Date.now();
    const nextPieces = buildPieces(config.gridSize);
    piecesRef.current = nextPieces;
    snappedMapRef.current = {};
    setPieces(nextPieces);
    setSnappedMap({});
    setTimeLeft(config.timeLimitSeconds);
    setStartTime(startedAt);
    startTimeRef.current = startedAt;
    setPuzzleImage(getRandomPuzzleImageFromPool(puzzleImagePool, puzzleImage?.id));
    setBoardOrigin(null);
    setTrayOrigin(null);
    setIsDraggingPiece(false);
    setShowConfetti(false);
    setShowReferencePhoto(false);
    if (referencePhotoTimerRef.current) {
      clearTimeout(referencePhotoTimerRef.current);
      referencePhotoTimerRef.current = null;
    }
    celebratedRef.current = false;
    warningSpokenRef.current = false;
    Speech.speak('Drag each piece to the matching spot.');
    setPhase('playing');
  };

  // ── Snap / unsnap ─────────────────────────────────────────
  const handleSnapped = useCallback((pieceId: number, slotIndex: number) => {
    const moved = pieces.find(p => p.id === pieceId);
    if (moved?.correctPosition === slotIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    setDifficulty(progress?.difficulty ?? difficulty);
    setPhase('instruction');
    piecesRef.current = [];
    snappedMapRef.current = {};
    startTimeRef.current = 0;
    setPieces([]);
    setSnappedMap({});
    setResult(null);
    setProgress(null);
    setBoardOrigin(null);
    setTrayOrigin(null);
    setIsDraggingPiece(false);
    setShowConfetti(false);
    setShowReferencePhoto(false);
    celebratedRef.current = false;
    warningSpokenRef.current = false;
    if (referencePhotoTimerRef.current) {
      clearTimeout(referencePhotoTimerRef.current);
      referencePhotoTimerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleShowReferencePhoto = () => {
    if (!puzzleImage) return;

    setShowReferencePhoto(true);
    Speech.speak('Here is the full photo.');

    if (referencePhotoTimerRef.current) {
      clearTimeout(referencePhotoTimerRef.current);
    }

    referencePhotoTimerRef.current = setTimeout(() => {
      setShowReferencePhoto(false);
      referencePhotoTimerRef.current = null;
    }, 5000);
  };

  const dismissReferencePhoto = () => {
    if (referencePhotoTimerRef.current) {
      clearTimeout(referencePhotoTimerRef.current);
      referencePhotoTimerRef.current = null;
    }
    setShowReferencePhoto(false);
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
          ...(isLoadingSession || isLoadingPuzzleImages
            ? [{ icon: 'image', text: 'Preparing your uploaded photos' }]
            : hasPersonalPuzzleImages
              ? [{ icon: 'image', text: 'Your uploaded photos will be used for this puzzle' }]
              : [{ icon: 'image', text: 'Default photos will be used if no uploaded photos are available' }]
          ),
          ...(config.timeLimitSeconds
            ? [{ icon: '⏱️', text: `Complete within ${config.timeLimitSeconds} seconds` }]
            : [{ icon: '♾️', text: 'No time limit - take your time' }]
          ),
        ]}
        onStart={handleStart}
        startDisabled={isLoadingSession || isLoadingPuzzleImages}
        startLabel={isLoadingSession || isLoadingPuzzleImages ? 'Loading Photos...' : 'Start Game'}
      />
    );
  }

  if (phase === 'result' && result) {
    return <GameResultScreen result={result} progress={progress} onPlayAgain={handleReset} />;
  }

  const isWarning = timeLeft !== null && timeLeft <= 15;

  // Exact tray height: label(24) + rows of pieces + gaps + padding*2
  const trayRows = Math.ceil(pieceCount / config.gridSize);
  const TRAY_HEIGHT = 24 + trayRows * cellSize + (trayRows - 1) * PIECE_GAP + TRAY_PADDING * 2;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top', 'bottom']}>
        {showConfetti && (
          <ConfettiCannon
            count={120}
            origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
            fadeOut
            fallSpeed={2600}
          />
        )}

        <GameHeader
          title="Photo Puzzle"
          difficulty={difficulty}
          timeLeft={timeLeft}
          totalSeconds={config.timeLimitSeconds}
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: '#f9fafb',
            paddingBottom: 16,
          }}
          bounces={false}
          scrollEnabled={!isDraggingPiece}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: H_PADDING, flex: 1, position: 'relative' }}>

          {/* Stats row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
            marginTop: 4,
          }}>
            <Animated.Text
              key={correctCount}
              entering={FadeIn.duration(250)}
              style={{ fontSize: 13, color: correctCount === pieceCount ? '#16a34a' : '#6b7280', fontWeight: correctCount === pieceCount ? '700' : '400' }}
            >
              {correctCount} / {pieceCount} placed correctly
            </Animated.Text>
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
            onLayout={handleBoardLayout}
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
            onLayout={handleTrayLayout}
            style={{
              width: PUZZLE_SIZE,
              alignSelf: 'center',
              // Exact calculated height - no overflow, no clipping
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

            {/* Tray slot outlines - visual placeholders */}
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

          {/* Reshuffle - always visible below tray */}
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

          {layoutReady && puzzleImage && (
            <View
              pointerEvents="box-none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
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
                    onDragStateChange={setIsDraggingPiece}
                    snappedSlot={snappedSlot}
                    isCorrect={isCorrect}
                    scale={snappedSlot === null ? TRAY_PIECE_SCALE : 1}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {canShowReferencePhoto && puzzleImage && (
        <TouchableOpacity
          onPress={handleShowReferencePhoto}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            right: 10,
            top: '42%',
            zIndex: 1200,
            width: 58,
            minHeight: 72,
            borderRadius: 18,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
            paddingHorizontal: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 22, marginBottom: 4 }}>🖼️</Text>
          <Text
            style={{
              color: '#ffffff',
              fontSize: 11,
              fontWeight: '800',
              textAlign: 'center',
              lineHeight: 13,
            }}
          >
            View Photo
          </Text>
        </TouchableOpacity>
      )}

      {showReferencePhoto && puzzleImage && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={dismissReferencePhoto}
          accessibilityRole="button"
          accessibilityLabel="Close full photo preview"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(17, 24, 39, 0.72)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: Math.min(SCREEN_WIDTH - 48, 360),
              maxHeight: '82%',
              backgroundColor: '#ffffff',
              borderRadius: 22,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.22,
              shadowRadius: 18,
              elevation: 12,
            }}
          >
            <Image
              source={puzzleImage.source}
              resizeMode="contain"
              style={{
                width: '100%',
                height: Math.min(SCREEN_WIDTH - 72, 420),
                borderRadius: 16,
                backgroundColor: '#111827',
              }}
            />
            <Text
              style={{
                marginTop: 10,
                color: '#4b5563',
                fontSize: 13,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Tap anywhere to close
            </Text>
          </View>
        </TouchableOpacity>
      )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}


