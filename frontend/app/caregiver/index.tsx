// import React, { useState } from 'react';
// import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
// import { router } from 'expo-router';
// import { DashboardHeader } from '../../src/components/caregiver/dashboard/DashboardHeader';
// import { InsightsBanner } from '../../src/components/caregiver/dashboard/InsightsBanner';
// import { PatientOverview } from '../../src/components/caregiver/dashboard/PatientOverview';
// import { StatsGrid } from '../../src/components/caregiver/dashboard/StatsGrid';
// import { UpcomingTasks } from '../../src/components/caregiver/dashboard/UpcomingTasks';
// import { Colors } from '../../src/constants/colors';
// import {
//   CaregiverInsight,
//   DashboardStats,
//   Patient,
//   Task,
// } from '../../src/types/caregiver.types';

// // ── Mock Data ──────────────────────────────────────────────────────────────
// const MOCK_STATS: DashboardStats = {
//   patients: 4,
//   tasks: { completed: 8, total: 12 },
//   meds: 3,
//   alerts: 2,
// };

// const MOCK_PATIENTS: Patient[] = [
//   {
//     id: '1',
//     name: 'Eleanor Vance',
//     initials: 'EV',
//     condition: 'Moderate',
//     avatarColor: '#4F8EF7',
//     emoji: '😊',
//     lastChecked: '2h ago',
//   },
//   {
//     id: '2',
//     name: 'Robert Chen',
//     initials: 'RC',
//     condition: 'Mild',
//     avatarColor: '#22C55E',
//     emoji: '😴',
//     lastChecked: '30m ago',
//   },
//   {
//     id: '3',
//     name: 'Maria Santos',
//     initials: 'MS',
//     condition: 'Stable',
//     avatarColor: '#8B5CF6',
//     emoji: '🙂',
//     lastChecked: '1h ago',
//   },
//   {
//     id: '4',
//     name: 'James Wilson',
//     initials: 'JW',
//     condition: 'Critical',
//     avatarColor: '#EF4444',
//     emoji: '😔',
//     lastChecked: '15m ago',
//   },
// ];

// const MOCK_INSIGHT: CaregiverInsight = {
//   score: 65,
//   level: 'Moderate',
//   message: 'Workload is currently heavy. Tap to view AI recommendations.',
// };

// const MOCK_TASKS: Task[] = [
//   {
//     id: '1',
//     title: 'Morning Bathing Assist',
//     patientName: 'Margaret Hughes',
//     time: '09:30 AM',
//     icon: 'water-outline',
//     completed: false,
//     assignee: 'SJ',
//   },
//   {
//     id: '2',
//     title: 'Lunch Feeding',
//     patientName: 'Eleanor Vance',
//     time: '12:00 PM',
//     icon: 'restaurant-outline',
//     completed: false,
//   },
//   {
//     id: '3',
//     title: 'Medication Check',
//     patientName: 'Robert Chen',
//     time: '02:00 PM',
//     icon: 'medical-outline',
//     completed: true,
//     assignee: 'SJ',
//   },
// ];
// // ──────────────────────────────────────────────────────────────────────────

// export default function CaregiverDashboard() {
//   const [tasks, setTasks]     = useState<Task[]>(MOCK_TASKS);
//   const [refreshing, setRefreshing] = useState(false);

//   const handleTaskComplete = (taskId: string) => {
//     setTasks((prev) =>
//       prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
//     );
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1200);
//   };

//   // ── Navigation helpers ─────────────────────────────────────────────────────
//   // Tab screens  → router.push with the tab name
//   // Sub-screens  → router.push with full path (hidden from tab bar)

//   const goToPatients     = () => router.push('/caregiver/patients');
//   const goToTasks        = () => router.push('/caregiver/tasks');
//   const goToInsights     = () => router.push('/caregiver/insights');
//   const goToMedications  = () => router.push('/caregiver/medications');
//   const goToAlerts       = () => router.push('/caregiver/alerts');
//   const goToMore         = () => router.push('/caregiver/more');

//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.background }}>
//       <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor={Colors.primary}
//           />
//         }
//         contentContainerStyle={{ paddingBottom: 120 }}
//       >
//         {/* ── Header
//              🔔 notification icon  → Alerts page
//              👤 profile avatar     → More page (profile lives there)       ── */}
//         <DashboardHeader
//           caregiverName="Sarah"
//           alertCount={2}
//           onNotificationPress={goToAlerts}
//           onProfilePress={goToMore}
//         />

//         {/* ── Stats Grid
//              Patients card  → Patients page
//              Tasks card     → Tasks page
//              Meds card      → Medications page
//              Alerts card    → Alerts page                                  ── */}
//         <StatsGrid
//           stats={MOCK_STATS}
//           onPatientPress={goToPatients}
//           onTaskPress={goToTasks}
//           onMedPress={goToMedications}
//           onAlertPress={goToAlerts}
//         />

//         {/* ── Patient Overview
//              "See all" button      → Patients page
//              Individual card tap   → Patients page                         ── */}
//         <PatientOverview
//           patients={MOCK_PATIENTS}
//           onSeeAllPress={goToPatients}
//           onPatientPress={(_patient) => goToPatients()}
//         />

//         {/* ── Caregiver Insights banner → Insights page                   ── */}
//         <InsightsBanner
//           insight={MOCK_INSIGHT}
//           onPress={goToInsights}
//         />

//         {/* ── Upcoming Tasks
//              "View schedule" button  → Tasks page
//              Individual task tap     → Tasks page
//              Checkbox tap            → toggles complete locally             ── */}
//         <UpcomingTasks
//           tasks={tasks}
//           onViewSchedule={goToTasks}
//           onTaskPress={(_task) => goToTasks()}
//           onTaskComplete={handleTaskComplete}
//         />
//       </ScrollView>
//     </View>
//   );
// }

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { router } from 'expo-router';
import { DashboardHeader } from '../../src/components/caregiver/dashboard/DashboardHeader';
import { InsightsBanner } from '../../src/components/caregiver/dashboard/InsightsBanner';
import { PatientOverview } from '../../src/components/caregiver/dashboard/PatientOverview';
import { StatsGrid } from '../../src/components/caregiver/dashboard/StatsGrid';
import { UpcomingTasks } from '../../src/components/caregiver/dashboard/UpcomingTasks';
import { Colors } from '../../src/constants/colors';
import { getStoredUser } from '../../src/api/authApi';
import { fetchPatients } from '../../src/services/caregiver/patientService';
import { fetchTasks, toggleTask } from '../../src/services/caregiver/taskService';
import { fetchMedications } from '../../src/services/caregiver/medicationService';
import { fetchNotifications } from '../../src/services/caregiver/Notificationservice';  
import {
  CaregiverInsight,
  CaregiverTask,
  DashboardStats,
  Patient,
  Task,
} from '../../src/types/caregiver.types';

// ── Static insight (no backend yet) ───────────────────────────────────────
const DEFAULT_INSIGHT: CaregiverInsight = {
  score: 65,
  level: 'Moderate',
  message: 'Workload is currently heavy. Tap to view AI recommendations.',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

const mapToPatient = (p: any): Patient => ({
  id: p.id,
  name: p.name,
  initials: p.initials || p.name.slice(0, 2).toUpperCase(),
  condition: p.condition || 'Stable',
  avatarColor: p.avatarColor || '#4F8EF7',
  emoji: p.emoji || '🙂',
  lastChecked: p.lastChecked || 'Just now',
});

const mapToTask = (t: CaregiverTask): Task => ({
  id: t.id,
  title: t.title,
  patientName: t.patientName,
  time: t.time,
  icon: 'checkmark-circle-outline',
  completed: t.status === 'done',
  assignee: t.assignee,
});

// ── Component ──────────────────────────────────────────────────────────────
export default function CaregiverDashboard() {

  // ✅ Real data states
  const [caregiverName, setCaregiverName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    tasks: { completed: 0, total: 0 },
    meds: 0,
    alerts: 0,
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load all real data ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // ✅ Real name from storage
      const user = await getStoredUser();
      if (user?.fullName) {
        setCaregiverName(getFirstName(user.fullName));
      }

      // ✅ Load patients, tasks and medications in parallel
      const [patientData, taskData, medData, notificationData] = await Promise.all([
        fetchPatients(),
        fetchTasks(new Date()),
        fetchMedications(),
        fetchNotifications(),   // ← result has no variable to land in
      ]);

      // ✅ Set real patients
      setPatients(patientData.map(mapToPatient));

      // ✅ Set real tasks
      setTasks(taskData.map(mapToTask));

      // ✅ Set real stats from all API data
      const completedCount = taskData.filter((t) => t.status === 'done').length;

      // Only unacknowledged notifications count as "alerts" — once the caregiver
      // taps one on the Alerts screen it's handled, so the badge should drop.
      const activeAlerts = notificationData.filter((n) => !n.acknowledged).length;

      setStats({
        patients: patientData.length,
        tasks: {
          completed: completedCount,
          total: taskData.length,
        },
        meds: medData.length,
        alerts: activeAlerts,        // ← was 0
      });

    } catch (error) {
      console.log('Dashboard load error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // ── Task complete ──────────────────────────────────────────────────────
  const handleTaskComplete = async (taskId: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
    try {
      await toggleTask(taskId);
      setTasks((prev) => {
        const completed = prev.filter((t) => t.completed).length;
        setStats((s) => ({
          ...s,
          tasks: { completed, total: prev.length },
        }));
        return prev;
      });
    } catch (error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t)
      );
    }
  };

  // ── Refresh ────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Navigation helpers (unchanged) ────────────────────────────────────
  const goToPatients = () => router.push('/caregiver/patients');
  const goToTasks = () => router.push('/caregiver/tasks');
  const goToInsights = () => router.push('/caregiver/insights');
  const goToMedications = () => router.push('/caregiver/medications');
  const goToAlerts = () => router.push('/caregiver/alerts');
  const goToMore = () => router.push('/caregiver/more');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
        {/* ── Header ── */}
        <DashboardHeader
          caregiverName={caregiverName}
          alertCount={stats.alerts}
          onNotificationPress={goToAlerts}
          onProfilePress={goToMore}
        />

        {/* ── Stats Grid ── */}
        <StatsGrid
          stats={stats}
          onPatientPress={goToPatients}
          onTaskPress={goToTasks}
          onMedPress={goToMedications}
          onAlertPress={goToAlerts}
        />

        {/* ── Patient Overview ── */}
        <PatientOverview
          patients={patients}
          onSeeAllPress={goToPatients}
          onPatientPress={(_patient) => goToPatients()}
        />

        {/* ── Caregiver Insights banner ── */}
        <InsightsBanner
          insight={DEFAULT_INSIGHT}
          onPress={goToInsights}
        />

        {/* ── Upcoming Tasks ── */}
        <UpcomingTasks
          tasks={tasks}
          onViewSchedule={goToTasks}
          onTaskPress={(_task) => goToTasks()}
          onTaskComplete={handleTaskComplete}
        />
      </ScrollView>
    </View>
  );
}