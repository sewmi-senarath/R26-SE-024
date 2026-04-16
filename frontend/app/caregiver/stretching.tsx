import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const STRETCHES = [
  { id: '1', emoji: '🙆', title: 'Neck Rolls',         duration: '30 sec', instruction: 'Slowly roll your head in a circle. Repeat 3 times each direction.' },
  { id: '2', emoji: '🤸', title: 'Shoulder Stretch',   duration: '45 sec', instruction: 'Pull one arm across your chest. Hold 15 sec. Switch sides.' },
  { id: '3', emoji: '🧘', title: 'Seated Forward Fold', duration: '60 sec', instruction: 'Sit tall, reach forward toward your toes. Hold and breathe.' },
  { id: '4', emoji: '🦵', title: 'Standing Quad Stretch', duration: '45 sec', instruction: 'Stand on one leg, pull other foot to glutes. Hold 20 sec each side.' },
  { id: '5', emoji: '🤲', title: 'Wrist Circles',       duration: '30 sec', instruction: 'Extend arms, rotate wrists in both directions 10 times.' },
];

export default function StretchingScreen() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allDone   = completed.size === STRETCHES.length;
  const progress  = (completed.size / STRETCHES.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/caregiver/wellbeing')}
            style={{
              width: 38, height: 38, borderRadius: 13,
              backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: Colors.borderLight,
            }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
              Stretch Break 🤸
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              5 minute full-body stretch routine
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

        {/* Progress card */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 20,
          padding: 18, marginBottom: 20,
          borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>
              {allDone ? '🎉 Routine Complete!' : `${completed.size} of ${STRETCHES.length} done`}
            </Text>
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
              backgroundColor: allDone ? Colors.successSoft : '#F5F3FF',
            }}>
              <Text style={{
                fontSize: 13, fontWeight: '800',
                color: allDone ? Colors.success : '#8B5CF6',
              }}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
          <View style={{
            height: 8, backgroundColor: Colors.borderLight,
            borderRadius: 4, overflow: 'hidden',
          }}>
            <View style={{
              width: `${progress}%`, height: '100%',
              backgroundColor: allDone ? Colors.success : '#8B5CF6',
              borderRadius: 4,
            }} />
          </View>
        </View>

        {/* Stretch list */}
        {STRETCHES.map((stretch) => {
          const isDone = completed.has(stretch.id);
          return (
            <View key={stretch.id} style={{
              backgroundColor: Colors.white, borderRadius: 20,
              padding: 16, marginBottom: 10,
              borderWidth: 1.5,
              borderColor: isDone ? '#8B5CF6' + '40' : Colors.borderLight,
              borderLeftWidth: 4,
              borderLeftColor: isDone ? Colors.success : '#8B5CF6',
              opacity: isDone ? 0.8 : 1,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {/* Emoji */}
                <View style={{
                  width: 50, height: 50, borderRadius: 16,
                  backgroundColor: isDone ? Colors.successSoft : '#F5F3FF',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>{stretch.emoji}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{
                      fontSize: 14, fontWeight: '800',
                      color: isDone ? Colors.textMuted : Colors.textPrimary,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    }}>
                      {stretch.title}
                    </Text>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                      backgroundColor: isDone ? Colors.successSoft : '#F5F3FF',
                    }}>
                      <Text style={{
                        fontSize: 10, fontWeight: '700',
                        color: isDone ? Colors.success : '#8B5CF6',
                      }}>
                        {stretch.duration}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, lineHeight: 17 }}>
                    {stretch.instruction}
                  </Text>
                </View>

                {/* Checkbox */}
                <TouchableOpacity
                  onPress={() => toggle(stretch.id)}
                  style={{
                    width: 30, height: 30, borderRadius: 15,
                    borderWidth: 2,
                    borderColor: isDone ? Colors.success : Colors.border,
                    backgroundColor: isDone ? Colors.success : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDone && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Reset */}
        {allDone && (
          <TouchableOpacity
            onPress={() => setCompleted(new Set())}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, height: 52, borderRadius: 16,
              backgroundColor: '#8B5CF6', marginTop: 8,
              shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.white} />
            <Text style={{ color: Colors.white, fontWeight: '800', fontSize: 15 }}>
              Restart Routine
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}