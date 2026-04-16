import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { WellbeingRecommendation } from '../../src/types/caregiver.types';

// ── Route map ─────────────────────────────────────────────────────────────────
const ACTION_ROUTES: Record<string, string> = {
  'Start 15m Timer':  '/caregiver/timer',
  'Start Exercise':   '/caregiver/breathing',
  'Log Water':        '/caregiver/hydration',
  'Start Stretching': '/caregiver/stretching',
};

// ── Lighter pastel colors ─────────────────────────────────────────────────────
const RECOMMENDATIONS: WellbeingRecommendation[] = [
  {
    id: '1',
    title: 'Time for a break',
    description: "You've been active for 4 hours straight. Taking a break now can improve your focus for the rest of the shift.",
    icon: 'cafe-outline',
    color: '#FB923C',       // ← lighter orange
    bgColor: '#FFF7ED',
    actionLabel: 'Start 15m Timer',
    duration: '15m',
  },
  {
    id: '2',
    title: 'Breathing Exercise',
    description: 'Your task load has been high. Try this 3-minute guided box breathing exercise to lower cortisol levels.',
    icon: 'leaf-outline',
    color: '#22D3EE',       // ← lighter cyan
    bgColor: '#ECFEFF',
    actionLabel: 'Start Exercise',
    duration: '3m',
  },
  {
    id: '3',
    title: 'Hydration Reminder',
    description: "You haven't logged water intake today. Staying hydrated helps with focus and energy levels.",
    icon: 'water-outline',
    color: '#60A5FA',       // ← lighter blue
    bgColor: '#EFF6FF',
    actionLabel: 'Log Water',
    duration: '1m',
  },
  {
    id: '4',
    title: 'Stretch Break',
    description: 'Sitting or standing in one position too long? A quick 5-minute stretch can relieve tension.',
    icon: 'fitness-outline',
    color: '#A78BFA',       // ← lighter purple
    bgColor: '#F5F3FF',
    actionLabel: 'Start Stretching',
    duration: '5m',
  },
];

export default function WellbeingScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handleAction = (actionLabel: string) => {
    const route = ACTION_ROUTES[actionLabel];
    if (route) router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
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
              Well-being
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
              Personalised recommendations for your self-care
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        <Text style={{
          fontSize: 16, fontWeight: '800',
          color: Colors.textPrimary, marginBottom: 14,
        }}>
          Recommended for You
        </Text>

        {RECOMMENDATIONS.map((rec) => (
          <View
            key={rec.id}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 20, padding: 16,
              marginBottom: 12,
              borderWidth: 1, borderColor: Colors.borderLight,
              borderLeftWidth: 4, borderLeftColor: rec.color,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
            }}
          >
            {/* Icon + title + duration */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              gap: 12, marginBottom: 12,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: rec.bgColor,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={rec.icon as keyof typeof Ionicons.glyphMap}
                  size={20} color={rec.color}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 4,
                }}>
                  <Text style={{
                    fontSize: 15, fontWeight: '800',
                    color: Colors.textPrimary,
                  }}>
                    {rec.title}
                  </Text>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderRadius: 10, backgroundColor: rec.bgColor,
                  }}>
                    <Text style={{
                      fontSize: 11, fontWeight: '700', color: rec.color,
                    }}>
                      {rec.duration}
                    </Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 12, color: Colors.textSecondary, lineHeight: 17,
                }}>
                  {rec.description}
                </Text>
              </View>
            </View>

            {/* Action button — lighter, outlined style */}
            <TouchableOpacity
              onPress={() => handleAction(rec.actionLabel)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 6,
                height: 42, borderRadius: 12,
                backgroundColor: rec.bgColor,
                borderWidth: 1.5,
                borderColor: rec.color + '60',
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '700', color: rec.color,
              }}>
                {rec.actionLabel}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={rec.color} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}