import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView, StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import { CheckInResult, DailyCheckIn } from '../../src/types/caregiver.types';
import {
  generateRecommendations,
  getSummaryMessage,
  SmartRecommendation,
} from '../../src/utils/recommendationEngine';

// ── Priority config ────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  critical: { label: 'Critical',  color: '#EF4444', bg: '#FEF2F2' },
  high:     { label: 'Important', color: '#F97316', bg: '#FFF7ED' },
  medium:   { label: 'Helpful',   color: '#3B82F6', bg: '#EFF6FF' },
  low:      { label: 'Bonus',     color: '#22C55E', bg: '#F0FDF4' },
};

// ── Recommendation Card ────────────────────────────────────────────────────
const SmartRecCard: React.FC<{
  rec: SmartRecommendation;
  index: number;
  onAction: (rec: SmartRecommendation) => void;
  onDismiss: (id: string) => void;
}> = ({ rec, index, onAction, onDismiss }) => {
  const pConfig = PRIORITY_CONFIG[rec.priority];
  const [expanded, setExpanded] = useState(rec.priority === 'critical');

  return (
    <View style={{
      backgroundColor: Colors.white, borderRadius: 20,
      marginBottom: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.borderLight,
      borderLeftWidth: 4, borderLeftColor: rec.color,
      shadowColor: rec.color, shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
    }}>
      {/* Card Header — always visible */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        style={{ padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Icon */}
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: rec.bg,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ionicons name={rec.icon as any} size={22} color={rec.color} />
          </View>

          {/* Title + badges */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.textPrimary, flex: 1 }}>
                {rec.title}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <View style={{
                backgroundColor: pConfig.bg, paddingHorizontal: 7,
                paddingVertical: 2, borderRadius: 6,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: pConfig.color }}>
                  {pConfig.label.toUpperCase()}
                </Text>
              </View>
              <View style={{
                backgroundColor: rec.bg, paddingHorizontal: 7,
                paddingVertical: 2, borderRadius: 6,
              }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: rec.color }}>
                  {rec.duration}
                </Text>
              </View>
              {rec.badge && (
                <Text style={{ fontSize: 10 }}>{rec.badge}</Text>
              )}
            </View>
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16} color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded && (
        <View style={{
          paddingHorizontal: 14, paddingBottom: 14,
          borderTopWidth: 1, borderTopColor: Colors.borderLight,
          paddingTop: 12,
        }}>
          {/* Personalized insight */}
          <View style={{
            backgroundColor: rec.bg + '80', borderRadius: 12,
            padding: 12, marginBottom: 12,
          }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              <Ionicons name="information-circle-outline" size={14} color={rec.color} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: rec.color }}>
                WHY THIS MATTERS FOR YOU
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
              {rec.insight}
            </Text>
          </View>

          {/* Specific action */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              <Ionicons name="arrow-forward-circle-outline" size={14} color={rec.color} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: rec.color }}>
                WHAT TO DO NOW
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.textPrimary, lineHeight: 18, fontWeight: '500' }}>
              {rec.action}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => onAction(rec)}
              style={{
                flex: 1, backgroundColor: rec.color, borderRadius: 10,
                paddingVertical: 10, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
              }}
            >
              <Ionicons name="play-outline" size={14} color={Colors.white} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.white }}>
                Start Now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDismiss(rec.id)}
              style={{
                paddingHorizontal: 14, backgroundColor: Colors.borderLight,
                borderRadius: 10, paddingVertical: 10,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textMuted }}>
                Done ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ── MAIN SCREEN ────────────────────────────────────────────────────────────
export default function WellbeingScreen() {
  const params = useLocalSearchParams();

  // Get data passed from insights page
  const stressLevel = (params.stressLevel as string) || 'Moderate';
  const stressScore = params.stressScore ? Number(params.stressScore) : 6;
  const formData    = params.formData ? JSON.parse(params.formData as string) as DailyCheckIn : null;

  const result: CheckInResult = {
    stressLevel:  stressLevel as 'Low' | 'Moderate' | 'High',
    stressScore,
    confidence:   0.85,
    message:      '',
    tips:         [],
    submittedAt:  new Date().toISOString(),
  };

  // Generate smart recommendations
  const defaultForm: DailyCheckIn = {
    sleepHours: 6, physicalTiredness: 3, mood: 3,
    emotionalOverwhelm: 3, hoursCaregiving: 8,
    tasksAssigned: 10, tasksCompleted: 8,
    difficultSituations: 2, breaksTaken: 1,
    mentallyExhausted: 3, difficultyManaging: 3, emotionallyDrained: 3,
  };

  const form = formData || defaultForm;
  const [recs, setRecs] = useState(generateRecommendations(form, result));
  const summaryMessage  = getSummaryMessage(form, result);

  const stressConfig = {
    High:     { color: '#EF4444', bg: '#FEF2F2', emoji: '😟' },
    Moderate: { color: '#F97316', bg: '#FFF7ED', emoji: '😐' },
    Low:      { color: '#22C55E', bg: '#F0FDF4', emoji: '😊' },
  }[stressLevel] || { color: '#F97316', bg: '#FFF7ED', emoji: '😐' };

  const handleAction = (rec: SmartRecommendation) => {
    if (rec.route) router.push(rec.route as any);
  };

  const handleDismiss = (id: string) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: Colors.borderLight,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>
              Smart Care Coach
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
              Personalised for your check-in today
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {/* Status banner */}
        <View style={{
          backgroundColor: stressConfig.bg, borderRadius: 20,
          padding: 16, marginBottom: 16,
          borderWidth: 1.5, borderColor: stressConfig.color + '30',
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <Text style={{ fontSize: 36 }}>{stressConfig.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: stressConfig.color, fontWeight: '700' }}>
              TODAY'S STRESS LEVEL
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: stressConfig.color }}>
              {stressLevel}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
              Score: {stressScore}/10
            </Text>
          </View>
          {/* Quick stats */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Tasks: {form.tasksCompleted}/{form.tasksAssigned}
            </Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Sleep: {form.sleepHours}h
            </Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Breaks: {form.breaksTaken}
            </Text>
          </View>
        </View>

        {/* Summary message */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 16,
          padding: 14, marginBottom: 20,
          borderWidth: 1, borderColor: Colors.borderLight,
        }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>
              PERSONALISED ANALYSIS
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 20 }}>
            {summaryMessage}
          </Text>
        </View>

        {/* Recommendation count */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
            Your Action Plan
          </Text>
          <View style={{
            backgroundColor: Colors.primaryLight, paddingHorizontal: 10,
            paddingVertical: 4, borderRadius: 12,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>
              {recs.length} actions
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        {recs.length === 0 ? (
          <View style={{
            backgroundColor: Colors.successSoft, borderRadius: 20,
            padding: 24, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.success }}>
              All done!
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
              You have completed all your recommended actions for today.
            </Text>
          </View>
        ) : (
          recs.map((rec, index) => (
            <SmartRecCard
              key={rec.id}
              rec={rec}
              index={index}
              onAction={handleAction}
              onDismiss={handleDismiss}
            />
          ))
        )}

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: Colors.primaryLight, borderRadius: 14,
            paddingVertical: 14, alignItems: 'center', marginTop: 8,
            borderWidth: 1, borderColor: Colors.primary + '40',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>
            Back to Insights
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}