import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    View,
} from 'react-native';
import { MoodChecker } from '../../src/components/caregiver/insights/MoodChecker';
import { RecommendationCard } from '../../src/components/caregiver/insights/RecommendationCard';
import { StressGauge } from '../../src/components/caregiver/insights/StressGauge';
import { WeeklyChart } from '../../src/components/caregiver/insights/WeeklyChart';
import { WellbeingStats } from '../../src/components/caregiver/insights/WellbeingStats';
import { Colors } from '../../src/constants/colors';
import {
    MoodType,
    Recommendation,
    StressLevel,
    WeeklyData,
    WellbeingStats as WellbeingStatsType,
} from '../../src/types/caregiver.types';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_STATS: WellbeingStatsType = {
  avgSleep: 6.5,
  activeHours: 42,
  tasksCompleted: 28,
  breaksTaken: 3,
};

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    title: 'Take a 15-minute break',
    description: "You've been active for 4 hours straight. Time for some water and a stretch.",
    icon: 'cafe-outline',
    color: Colors.accent,
    bgColor: Colors.accentSoft,
    urgent: true,
  },
  {
    id: 'r2',
    title: 'Delegate evening tasks',
    description: 'David (Family) is available tonight. Consider asking him to handle dinner.',
    icon: 'people-outline',
    color: Colors.primary,
    bgColor: Colors.primaryLight,
    urgent: false,
  },
  {
    id: 'r3',
    title: 'Improve sleep schedule',
    description: 'You averaged 5.8 hrs this week. Aim for 7+ hrs for better caregiving performance.',
    icon: 'moon-outline',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    urgent: false,
  },
];

const MOCK_WEEKLY: WeeklyData[] = [
  { day: 'Mon', stress: 40, tasks: 8  },
  { day: 'Tue', stress: 55, tasks: 10 },
  { day: 'Wed', stress: 70, tasks: 12 },
  { day: 'Thu', stress: 45, tasks: 7  },
  { day: 'Fri', stress: 80, tasks: 14 },
  { day: 'Sat', stress: 60, tasks: 9  },
  { day: 'Sun', stress: 65, tasks: 11 },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [stressLevel]       = useState<StressLevel>('Moderate');
  const [stressScore]       = useState(65);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(MOCK_RECOMMENDATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const handleDismissRecommendation = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMoodSelect = (mood: MoodType) => {
    console.log('Mood selected:', mood);
    // TODO: send to backend
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Fixed Header ── */}
      <View
        style={{
          backgroundColor: Colors.background,
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 24, fontWeight: '800',
                color: Colors.textPrimary,
              }}
            >
              Your Wellbeing
            </Text>
            <Text
              style={{
                fontSize: 13, color: Colors.textMuted, marginTop: 3,
              }}
            >
              Taking care of yourself helps you care for others
            </Text>
          </View>

          {/* Live indicator */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: Colors.successSoft,
              paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: 20,
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: Colors.success,
              }}
            />
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.success }}>
              Live
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Stress Gauge ── */}
        <StressGauge level={stressLevel} score={stressScore} />

        {/* ── Wellbeing Stats ── */}
        <WellbeingStats stats={MOCK_STATS} />

        {/* ── Weekly Chart ── */}
        <WeeklyChart data={MOCK_WEEKLY} />

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16, fontWeight: '800',
                  color: Colors.textPrimary,
                }}
              >
                Recommendations
              </Text>
              <View
                style={{
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: Colors.primaryLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 11, fontWeight: '700',
                    color: Colors.primary,
                  }}
                >
                  {recommendations.length} for you
                </Text>
              </View>
            </View>

            {recommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                index={index}
                onDismiss={handleDismissRecommendation}
              />
            ))}
          </View>
        )}

        {/* ── Mood Checker ── */}
        <MoodChecker onMoodSelect={handleMoodSelect} />

        {/* ── Bottom tip card ── */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 10,
            backgroundColor: Colors.primary,
            borderRadius: 24,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 44, height: 44, borderRadius: 16,
              backgroundColor: '#ffffff25',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="bulb-outline" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13, fontWeight: '800',
                color: Colors.white, marginBottom: 3,
              }}
            >
              Did you know?
            </Text>
            <Text
              style={{
                fontSize: 12, color: '#ffffffcc', lineHeight: 17,
              }}
            >
              Caregivers who take regular breaks are 40% more effective in their roles.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}