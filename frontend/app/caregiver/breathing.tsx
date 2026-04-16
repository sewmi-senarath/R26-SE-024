import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';

// ── Box breathing phases ──────────────────────────────────────────────────────
const PHASES = [
  { label: 'Inhale',  duration: 4, color: '#38BDF8', bg: '#F0F9FF', instruction: 'Breathe in slowly through your nose'  },
  { label: 'Hold',    duration: 4, color: '#818CF8', bg: '#EEF2FF', instruction: 'Hold your breath gently'              },
  { label: 'Exhale',  duration: 4, color: '#34D399', bg: '#F0FDF4', instruction: 'Breathe out slowly through your mouth' },
  { label: 'Hold',    duration: 4, color: '#FBBF24', bg: '#FFFBEB', instruction: 'Rest and hold before next breath'      },
];

const TOTAL_CYCLES = 3;

export default function BreathingScreen() {
  const [isRunning, setIsRunning]   = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(PHASES[0].duration);
  const [cycleCount, setCycleCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circleScale = useRef(new Animated.Value(0.75)).current;
  const circleAnim  = useRef<Animated.CompositeAnimation | null>(null);

  const currentPhase = PHASES[phaseIndex];

  // Animate circle per phase
  useEffect(() => {
    if (!isRunning) return;
    circleAnim.current?.stop();

    const targets: Record<string, number> = {
      Inhale: 1.3,
      Exhale: 0.75,
    };
    const target = targets[currentPhase.label];

    if (target !== undefined) {
      circleAnim.current = Animated.timing(circleScale, {
        toValue: target,
        duration: currentPhase.duration * 1000,
        useNativeDriver: true,
      });
      circleAnim.current.start();
    }
    // Hold phases keep current scale
  }, [isRunning, phaseIndex]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current!);
      return;
    }
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      setPhaseTimer((prev) => {
        if (prev <= 1) {
          const nextIndex = (phaseIndex + 1) % PHASES.length;
          if (nextIndex === 0) {
            const nextCycle = cycleCount + 1;
            if (nextCycle >= TOTAL_CYCLES) {
              clearInterval(intervalRef.current!);
              setIsRunning(false);
              setIsFinished(true);
              return 0;
            }
            setCycleCount(nextCycle);
          }
          setPhaseIndex(nextIndex);
          return PHASES[(phaseIndex + 1) % PHASES.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, phaseIndex, cycleCount]);

  const handleStart = () => {
    setIsRunning(true);
    setPhaseIndex(0);
    setPhaseTimer(PHASES[0].duration);
    setCycleCount(0);
    setIsFinished(false);
    circleScale.setValue(0.75);
  };

  const handleStop = () => {
    circleAnim.current?.stop();
    clearInterval(intervalRef.current!);
    setIsRunning(false);
    setIsFinished(false);
    setPhaseIndex(0);
    setPhaseTimer(PHASES[0].duration);
    setCycleCount(0);
    circleScale.setValue(0.75);
  };

  // Background shifts with phase
  const screenBg = isRunning ? currentPhase.bg : '#F0F9FF';

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/caregiver/wellbeing')}  // ← fixed
            style={{
              width: 38, height: 38, borderRadius: 13,
              backgroundColor: Colors.white,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: Colors.borderLight,
            }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
              Box Breathing 🌬️
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              3 cycles · 4 seconds each phase
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {isFinished ? (
          /* ── Finished ── */
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 80, marginBottom: 16 }}>🧘</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#38BDF8', marginBottom: 8 }}>
              Well Done!
            </Text>
            <Text style={{
              fontSize: 14, color: Colors.textMuted,
              textAlign: 'center', marginBottom: 32, lineHeight: 22,
              paddingHorizontal: 20,
            }}>
              Your breathing is calmer now. You're ready to continue with focused energy!
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleStart}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: Colors.white,
                  paddingHorizontal: 20, paddingVertical: 13,
                  borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
                }}
              >
                <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                <Text style={{ color: Colors.textSecondary, fontWeight: '700', fontSize: 14 }}>
                  Again
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/caregiver/wellbeing')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: '#38BDF8',
                  paddingHorizontal: 20, paddingVertical: 13,
                  borderRadius: 16,
                  shadowColor: '#38BDF8',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 14 }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* ── Phase label ── */}
            <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 8 }}>
              <Text style={{
                fontSize: 32, fontWeight: '900',
                color: isRunning ? currentPhase.color : Colors.textMuted,
                marginBottom: 6,
              }}>
                {isRunning ? currentPhase.label : 'Ready?'}
              </Text>
              <Text style={{
                fontSize: 14, color: Colors.textMuted,
                textAlign: 'center', paddingHorizontal: 40,
              }}>
                {isRunning ? currentPhase.instruction : 'Follow the circle to guide your breathing'}
              </Text>
            </View>

            {/* ── Animated circle ── */}
            <View style={{ height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              {/* Outer decorative rings */}
              <View style={{
                position: 'absolute', width: 240, height: 240, borderRadius: 120,
                borderWidth: 1, borderColor: isRunning ? currentPhase.color + '20' : Colors.border,
              }} />
              <View style={{
                position: 'absolute', width: 200, height: 200, borderRadius: 100,
                borderWidth: 1.5, borderColor: isRunning ? currentPhase.color + '35' : Colors.borderLight,
              }} />

              {/* Main animated circle */}
              <Animated.View style={{
                width: 150, height: 150, borderRadius: 75,
                backgroundColor: isRunning ? currentPhase.color : Colors.borderLight,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ scale: circleScale }],
                shadowColor: isRunning ? currentPhase.color : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35, shadowRadius: 20, elevation: 6,
              }}>
                {isRunning ? (
                  <>
                    <Text style={{
                      fontSize: 44, fontWeight: '900', color: Colors.white,
                    }}>
                      {phaseTimer}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#ffffffcc', fontWeight: '600' }}>
                      seconds
                    </Text>
                  </>
                ) : (
                  <Ionicons name="leaf-outline" size={44} color={Colors.textMuted} />
                )}
              </Animated.View>
            </View>

            {/* ── Phase steps ── */}
            <View style={{ flexDirection: 'row', gap: 6, width: '100%', marginBottom: 20 }}>
              {PHASES.map((p, i) => {
                const isActive = isRunning && i === phaseIndex;
                return (
                  <View key={i} style={{
                    flex: 1, alignItems: 'center', paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: isActive ? p.color + '18' : Colors.white,
                    borderWidth: 1.5,
                    borderColor: isActive ? p.color : Colors.borderLight,
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: '800',
                      color: isActive ? p.color : Colors.textMuted,
                      marginBottom: 2,
                    }}>
                      {p.label}
                    </Text>
                    <Text style={{ fontSize: 9, color: Colors.textMuted }}>
                      {p.duration}s
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ── Cycle progress dots ── */}
            {isRunning && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                  <View key={i} style={{
                    height: 6, flex: 1, borderRadius: 3,
                    backgroundColor:
                      i < cycleCount ? Colors.success :
                      i === cycleCount ? currentPhase.color :
                      Colors.borderLight,
                  }} />
                ))}
              </View>
            )}

            {!isRunning && <View style={{ marginBottom: 24 }} />}

            {/* ── Controls ── */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              {isRunning && (
                <TouchableOpacity
                  onPress={handleStop}
                  style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: Colors.white,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: Colors.border,
                  }}
                >
                  <Ionicons name="stop-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={isRunning ? handleStop : handleStart}
                style={{
                  flex: 1, height: 52, borderRadius: 16,
                  backgroundColor: isRunning ? Colors.dangerSoft : '#EFF9FF',
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  borderWidth: 1.5,
                  borderColor: isRunning ? Colors.danger + '40' : '#38BDF840',
                }}
              >
                <Ionicons
                  name={isRunning ? 'stop-circle-outline' : 'play-circle-outline'}
                  size={22}
                  color={isRunning ? Colors.danger : '#38BDF8'}
                />
                <Text style={{
                  fontWeight: '800', fontSize: 15,
                  color: isRunning ? Colors.danger : '#38BDF8',
                }}>
                  {isRunning ? 'Stop' : 'Begin Exercise'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}