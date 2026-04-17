import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const TOTAL_SECONDS = 15 * 60;

const TIPS = [
  { emoji: '💧', text: 'Drink a full glass of water'          },
  { emoji: '🚶', text: 'Take a gentle walk around the ward'   },
  { emoji: '👀', text: 'Rest your eyes — look at something far away' },
  { emoji: '🧘', text: 'Do some light neck and shoulder rolls' },
  { emoji: '🍎', text: 'Have a healthy snack if you need one' },
];

export default function TimerScreen() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning]     = useState(false);
  const [isFinished, setIsFinished]   = useState(false);
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim                     = useRef(new Animated.Value(1)).current;
  const pulseRef                      = useRef<Animated.CompositeAnimation | null>(null);

  // Pulse when running
  useEffect(() => {
    if (isRunning) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isRunning]);

  // Countdown
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(TOTAL_SECONDS);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const percent = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  const ringColor =
    isFinished ? Colors.success :
    isRunning  ? '#FB923C' :
                 Colors.borderLight;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
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
              Break Timer ⏱️
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              15 minutes to recharge and reset
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', padding: 20, paddingBottom: 60 }}
      >
        {isFinished ? (
          /* ── Finished state ── */
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 80, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: Colors.success, marginBottom: 8 }}>
              Break Complete!
            </Text>
            <Text style={{
              fontSize: 14, color: Colors.textMuted,
              textAlign: 'center', marginBottom: 32, lineHeight: 22,
              paddingHorizontal: 20,
            }}>
              Great job looking after yourself. You're ready to provide excellent care!
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleReset}
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
                  backgroundColor: Colors.success,
                  paddingHorizontal: 20, paddingVertical: 13,
                  borderRadius: 16,
                  shadowColor: Colors.success,
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
            {/* ── Timer circle ── */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 32, marginTop: 16 }}>
              <View style={{
                width: 220, height: 220, borderRadius: 110,
                backgroundColor: Colors.white,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#FB923C',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isRunning ? 0.2 : 0.06,
                shadowRadius: 24, elevation: 6,
                borderWidth: 6,
                borderColor: ringColor,
              }}>
                <Text style={{
                  fontSize: 11, fontWeight: '700',
                  color: Colors.textMuted, letterSpacing: 2, marginBottom: 4,
                }}>
                  BREAK TIME
                </Text>
                <Text style={{
                  fontSize: 52, fontWeight: '900',
                  color: isRunning ? '#FB923C' : Colors.textPrimary,
                  letterSpacing: -2,
                }}>
                  {timeStr}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
                  {isRunning ? 'Enjoy your break ☕' : 'Ready when you are'}
                </Text>
              </View>
            </Animated.View>

            {/* Progress bar */}
            {isRunning && (
              <View style={{
                width: '100%', height: 6,
                backgroundColor: Colors.borderLight,
                borderRadius: 3, overflow: 'hidden', marginBottom: 28,
              }}>
                <View style={{
                  width: `${percent}%`, height: '100%',
                  backgroundColor: '#FB923C', borderRadius: 3,
                }} />
              </View>
            )}

            {!isRunning && <View style={{ marginBottom: 28 }} />}

            {/* Controls */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 36, width: '100%' }}>
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: Colors.white,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: Colors.border,
                }}
              >
                <Ionicons name="refresh-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsRunning(!isRunning)}
                style={{
                  flex: 1, height: 52, borderRadius: 16,
                  backgroundColor: isRunning ? Colors.dangerSoft : '#FFF7ED',
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  borderWidth: 1.5,
                  borderColor: isRunning ? Colors.danger + '40' : '#FB923C40',
                }}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={20}
                  color={isRunning ? Colors.danger : '#FB923C'}
                />
                <Text style={{
                  fontWeight: '800', fontSize: 15,
                  color: isRunning ? Colors.danger : '#FB923C',
                }}>
                  {isRunning ? 'Pause' : 'Start Break'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tips card */}
            <View style={{
              backgroundColor: Colors.white, borderRadius: 20,
              padding: 18, width: '100%',
              borderWidth: 1, borderColor: Colors.borderLight,
            }}>
              <Text style={{
                fontSize: 12, fontWeight: '700', color: Colors.textMuted,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
              }}>
                What to do during your break
              </Text>
              {TIPS.map((tip, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: i < TIPS.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.borderLight,
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 11,
                    backgroundColor: '#FFF7ED',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 17 }}>{tip.emoji}</Text>
                  </View>
                  <Text style={{
                    fontSize: 13, color: Colors.textSecondary, flex: 1,
                  }}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}