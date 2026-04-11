import React, { useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { DashboardHeader } from '../../src/components/caregiver/dashboard/DashboardHeader';
import { InsightsBanner } from '../../src/components/caregiver/dashboard/InsightsBanner';
import { PatientOverview } from '../../src/components/caregiver/dashboard/PatientOverview';
import { StatsGrid } from '../../src/components/caregiver/dashboard/StatsGrid';
import { UpcomingTasks } from '../../src/components/caregiver/dashboard/UpcomingTasks';
import { Colors } from '../../src/constants/colors';
import {
    CaregiverInsight,
    DashboardStats,
    Patient,
    Task,
} from '../../src/types/caregiver.types';

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_STATS: DashboardStats = {
  patients: 4,
  tasks: { completed: 8, total: 12 },
  meds: 3,
  alerts: 2,
};

const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Eleanor Vance',
    initials: 'EV',
    condition: 'Moderate',
    avatarColor: '#4F8EF7',
    emoji: '😊',
    lastChecked: '2h ago',
  },
  {
    id: '2',
    name: 'Robert Chen',
    initials: 'RC',
    condition: 'Mild',
    avatarColor: '#22C55E',
    emoji: '😴',
    lastChecked: '30m ago',
  },
  {
    id: '3',
    name: 'Maria Santos',
    initials: 'MS',
    condition: 'Stable',
    avatarColor: '#8B5CF6',
    emoji: '🙂',
    lastChecked: '1h ago',
  },
  {
    id: '4',
    name: 'James Wilson',
    initials: 'JW',
    condition: 'Critical',
    avatarColor: '#EF4444',
    emoji: '😔',
    lastChecked: '15m ago',
  },
];

const MOCK_INSIGHT: CaregiverInsight = {
  score: 65,
  level: 'Moderate',
  message: 'Workload is currently heavy. Tap to view AI recommendations.',
};

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Morning Bathing Assist',
    patientName: 'Margaret Hughes',
    time: '09:30 AM',
    icon: 'water-outline',
    completed: false,
    assignee: 'SJ',
  },
  {
    id: '2',
    title: 'Lunch Feeding',
    patientName: 'Eleanor Vance',
    time: '12:00 PM',
    icon: 'restaurant-outline',
    completed: false,
  },
  {
    id: '3',
    title: 'Medication Check',
    patientName: 'Robert Chen',
    time: '02:00 PM',
    icon: 'medical-outline',
    completed: true,
    assignee: 'SJ',
  },
];
// ──────────────────────────────────────────────────────────────────────────

export default function CaregiverDashboard() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [refreshing, setRefreshing] = useState(false);

  const handleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

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
        <DashboardHeader
          caregiverName="Sarah"
          alertCount={2}
          onNotificationPress={() => console.log('Notifications')}
          onProfilePress={() => console.log('Profile')}
        />

        <StatsGrid
          stats={MOCK_STATS}
          onPatientPress={() => console.log('Patients')}
          onTaskPress={() => console.log('Tasks')}
        />

        <PatientOverview
          patients={MOCK_PATIENTS}
          onSeeAllPress={() => console.log('See all patients')}
          onPatientPress={(p) => console.log('Patient:', p.name)}
        />

        <InsightsBanner
          insight={MOCK_INSIGHT}
          onPress={() => console.log('Insights')}
        />

        <UpcomingTasks
          tasks={tasks}
          onViewSchedule={() => console.log('Schedule')}
          onTaskPress={(t) => console.log('Task:', t.title)}
          onTaskComplete={handleTaskComplete}
        />
      </ScrollView>
    </View>
  );
}