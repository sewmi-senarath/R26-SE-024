import { useAssessmentSession } from '@/src/hooks/useAssessmentSession';
import { getSeverityInfo } from '@/src/utils/scoring';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// At the top of the file
const PATIENT_ID = 'patient_001';
const CAREGIVER_ID = 'caregiver-001';

// ── Colour maps for each severity level 
const SEVERITY_STYLES = {
  none: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100',
    badgeText: 'text-green-800',
    bar: 'bg-green-500',
    icon: '✓',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  mild: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-800',
    bar: 'bg-amber-500',
    icon: '!',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  moderate: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100',
    badgeText: 'text-orange-800',
    bar: 'bg-orange-500',
    icon: '!!',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  severe: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100',
    badgeText: 'text-red-800',
    bar: 'bg-red-500',
    icon: '!!!',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

// Section max scores — fixed MMSE values
const SECTION_MAX: Record<string, number> = {
  Orientation: 10,
  Registration: 3,
  Attention: 5,
  Recall: 3,
  Language: 9,
};

const format3 = (value: number) => Number(value).toFixed(3);

export default function ResultsScreen() {
  const router = useRouter();
  const { session } = useAssessmentSession(PATIENT_ID, CAREGIVER_ID);

  // ── Move ALL hooks to top — BEFORE any conditional logic ──────
  const animatedScore = useRef(new Animated.Value(0)).current;
  const scoreBarWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only animate if session is done
    if (session.status !== 'done') return;

    Animated.timing(animatedScore, {
      toValue: session.totalScore,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    Animated.timing(scoreBarWidth, {
      toValue: (session.totalScore / 30) * 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [session.totalScore, session.status, animatedScore, scoreBarWidth]);

  // ── NOW you can do conditional checks ──────────────────────────
  if (session.status !== 'done') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">No completed assessment found.</Text>
        <TouchableOpacity
          onPress={() => router.replace('/patient/cognitive/assessment')}
          className="mt-4"
        >
          <Text className="text-blue-500">Start Assessment</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Now it's safe to compute severity info
  const severityInfo = getSeverityInfo(session.totalScore);
  const styles = SEVERITY_STYLES[severityInfo.level];

  // ── Animated score counter ────────────────────────────────────
  // const animatedScoreText = animatedScore.interpolate({
  //   inputRange: [0, 30],
  //   outputRange: ['0', '30'],
  // });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ─────────────────────────────────────────── */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Assessment Complete
          </Text>
          <Text className="text-2xl font-bold text-gray-900">
            MMSE Results
          </Text>
          {session.completedAt && (
            <Text className="text-xs text-gray-400 mt-1">
              Completed {new Date(session.completedAt).toLocaleString()}
            </Text>
          )}
        </View>

        {/* ── Total score card ───────────────────────────────── */}
        <View className={`mx-6 rounded-3xl border p-6 mb-4 ${styles.bg} ${styles.border}`}>

          {/* Severity icon + label row */}
          <View className="flex-row items-center gap-3 mb-5">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${styles.iconBg}`}>
              <Text className={`font-bold text-sm ${styles.iconColor}`}>
                {styles.icon}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500 uppercase tracking-wide">
                Dementia Level
              </Text>
              <Text className="text-lg font-bold text-gray-900">
                {severityInfo.label}
              </Text>
            </View>

            {/* Score badge — top right */}
            <View className={`ml-auto px-3 py-1.5 rounded-xl ${styles.badge}`}>
              <Text className={`text-xs font-semibold ${styles.badgeText}`}>
                Range: {severityInfo.scoreRange}
              </Text>
            </View>
          </View>

          {/* Animated total score */}
          <View className="items-center mb-5">
            <View className="flex-row items-end gap-1">
              <Animated.Text
                style={{
                  fontSize: 64,
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: 72,
                }}
              >
                {format3(session.totalScore)}
              </Animated.Text>
              <Text className="text-2xl font-semibold text-gray-400 mb-3">
                / {format3(30)}
              </Text>
            </View>
            <Text className="text-sm text-gray-500 text-center mt-1">
              {severityInfo.description}
            </Text>
          </View>

          {/* Score progress bar */}
          <View className="h-3 bg-white rounded-full overflow-hidden">
            <Animated.View
              className={`h-full rounded-full ${styles.bar}`}
              style={{
                width: scoreBarWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>

          {/* Scale markers */}
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-xs text-gray-400">0</Text>
            <Text className="text-xs text-gray-400">Impairment threshold: 23</Text>
            <Text className="text-xs text-gray-400">30</Text>
          </View>
        </View>

        {/* ── Impairment flag banner ─────────────────────────── */}
        {session.impairmentFlag && (
          <View className="mx-6 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-3">
            <Text className="text-red-500 text-lg">⚠</Text>
            <Text className="text-sm text-red-700 flex-1">
              Score is at or below the impairment threshold of 23. Clinical review is recommended.
            </Text>
          </View>
        )}

        {/* ── Section breakdown ──────────────────────────────── */}
        <View className="mx-6 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Score Breakdown
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {Object.entries(session.sectionScores).map(([section, score], index, arr) => {
              const max = SECTION_MAX[section] ?? 0;
              const pct = max > 0 ? (score / max) * 100 : 0;
              const isLast = index === arr.length - 1;

              return (
                <View
                  key={section}
                  className={`px-4 py-4 ${!isLast ? 'border-b border-gray-50' : ''}`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-medium text-gray-800">{section}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-sm font-bold text-gray-900">
                        {format3(score)}
                      </Text>
                      <Text className="text-sm text-gray-400">
                        / {format3(max)}
                      </Text>
                    </View>
                  </View>

                  {/* Per-section mini bar */}
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Severity scale reference ───────────────────────── */}
        <View className="mx-6 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            MMSE Severity Scale
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {([
              { range: '24 - 30', label: 'No Impairment', color: 'bg-green-400' },
              { range: '19 - 23', label: 'Mild Impairment', color: 'bg-amber-400' },
              { range: '10 - 18', label: 'Moderate Impairment', color: 'bg-orange-400' },
              { range: '0 - 9',  label: 'Severe Impairment', color: 'bg-red-400' },
            ]).map((band, index, arr) => {
              const isActive = severityInfo.scoreRange === band.range;
              const isLast = index === arr.length - 1;

              return (
                <View
                  key={band.range}
                  className={`
                    flex-row items-center px-4 py-3 gap-3
                    ${isActive ? 'bg-gray-50' : ''}
                    ${!isLast ? 'border-b border-gray-50' : ''}
                  `}
                >
                  {/* Colour dot */}
                  <View className={`w-2.5 h-2.5 rounded-full ${band.color}`} />

                  <Text className={`flex-1 text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {band.label}
                  </Text>

                  <Text className={`text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                    {band.range}
                  </Text>

                  {/* Active indicator */}
                  {isActive && (
                    <View className="bg-blue-500 rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-medium">
                        Patient
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Session metadata ───────────────────────────────── */}
        <View className="mx-6 mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Session Details
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {([
              { label: 'Patient ID', value: session.patientId },
              { label: 'Caregiver ID', value: session.caregiverId },
              { label: 'Session ID', value: session.sessionId.slice(0, 8) + '...' },
              { label: 'Started', value: new Date(session.startedAt).toLocaleTimeString() },
              {
                label: 'Duration',
                value: session.completedAt
                  ? `${Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} min`
                  : '—'
              },
              { label: 'Mode', value: session.administrationMode },
            ]).map((row, index, arr) => (
              <View
                key={row.label}
                className={`flex-row justify-between px-4 py-3 ${index !== arr.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <Text className="text-sm text-gray-500">{row.label}</Text>
                <Text className="text-sm font-medium text-gray-800">{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Action buttons ─────────────────────────────────── */}
        <View className="mx-6 gap-3">

          {/* Primary — send to Caregiver / backend */}
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-2xl items-center"
            onPress={() => {
              // TODO: call your backend API here
              // POST /api/assessments with session data
              console.log('Submitting session:', session.sessionId);
            }}
          >
            <Text className="text-white font-semibold text-base">
              Submit to Caregiver
            </Text>
          </TouchableOpacity>

          {/* Secondary — go back to patient dashboard */}
          <TouchableOpacity
            className="border border-gray-200 py-4 rounded-2xl items-center"
            onPress={() => router.replace('/patient/cognitive/games')}
          >
            <Text className="text-gray-600 font-medium text-base">
              Go to Games
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}