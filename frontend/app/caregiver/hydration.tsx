import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const GOAL_ML   = 2000;
const CUP_ML    = 250;
const MAX_CUPS  = GOAL_ML / CUP_ML; 

export default function HydrationScreen() {
  const [cups, setCups] = useState(0);

  const totalMl   = cups * CUP_ML;
  const percent   = Math.min((totalMl / GOAL_ML) * 100, 100);
  const isGoalMet = totalMl >= GOAL_ML;

  const add    = () => setCups((c) => Math.min(c + 1, MAX_CUPS));
  const remove = () => setCups((c) => Math.max(c - 1, 0));

  const levelColor =
    percent >= 100 ? Colors.success :
    percent >= 50  ? Colors.primary :
                     '#06B6D4';

  const tips = [
    { emoji: '🌅', text: 'Start your day with a glass of water' },
    { emoji: '⏰', text: 'Set reminders every 2 hours'          },
    { emoji: '🍋', text: 'Add lemon for a refreshing twist'     },
    { emoji: '🥗', text: 'Eat water-rich fruits and vegetables' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F9FF' }}>
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
              Hydration 💧
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              Daily goal: {GOAL_ML}ml · {MAX_CUPS} cups
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

        {/* Water bottle visual */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24,
          padding: 24, marginBottom: 16,
          alignItems: 'center',
          borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
        }}>
          {isGoalMet && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: Colors.successSoft,
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 20, marginBottom: 16,
            }}>
              <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.success }}>
                Daily Goal Reached! 🎉
              </Text>
            </View>
          )}

          {/* Cup grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {Array.from({ length: MAX_CUPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 48, height: 58, borderRadius: 12,
                  backgroundColor: i < cups ? '#06B6D4' : Colors.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: i < cups ? '#06B6D4' : Colors.border,
                }}
              >
                <Ionicons
                  name={i < cups ? 'water' : 'water-outline'}
                  size={22}
                  color={i < cups ? Colors.white : Colors.textMuted}
                />
              </View>
            ))}
          </View>

          {/* Stats */}
          <Text style={{ fontSize: 40, fontWeight: '900', color: levelColor }}>
            {totalMl}
            <Text style={{ fontSize: 18, fontWeight: '500', color: Colors.textMuted }}>
              ml
            </Text>
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 16 }}>
            {cups} of {MAX_CUPS} cups · {GOAL_ML - totalMl > 0 ? `${GOAL_ML - totalMl}ml remaining` : 'Goal complete!'}
          </Text>

          {/* Progress bar */}
          <View style={{
            width: '100%', height: 12,
            backgroundColor: Colors.borderLight,
            borderRadius: 6, overflow: 'hidden', marginBottom: 20,
          }}>
            <View style={{
              width: `${percent}%`, height: '100%',
              backgroundColor: levelColor, borderRadius: 6,
            }} />
          </View>

          {/* +/- Controls */}
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={remove}
              disabled={cups === 0}
              style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: cups === 0 ? Colors.borderLight : Colors.dangerSoft,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: cups === 0 ? Colors.border : Colors.danger + '40',
              }}
            >
              <Ionicons name="remove" size={24} color={cups === 0 ? Colors.textMuted : Colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={add}
              disabled={isGoalMet}
              style={{
                flex: 1, height: 52, borderRadius: 16,
                backgroundColor: isGoalMet ? Colors.successSoft : '#06B6D4',
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                shadowColor: '#06B6D4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
              }}
            >
              <Ionicons name="add" size={22} color={isGoalMet ? Colors.success : Colors.white} />
              <Text style={{
                fontSize: 15, fontWeight: '800',
                color: isGoalMet ? Colors.success : Colors.white,
              }}>
                {isGoalMet ? 'Goal Met! ✓' : `Log 1 Cup (${CUP_ML}ml)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <Text style={{
          fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12,
        }}>
          Hydration Tips
        </Text>
        {tips.map((tip, i) => (
          <View key={i} style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: Colors.white, borderRadius: 16,
            padding: 14, marginBottom: 8,
            borderWidth: 1, borderColor: Colors.borderLight,
          }}>
            <Text style={{ fontSize: 24 }}>{tip.emoji}</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, flex: 1 }}>{tip.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}