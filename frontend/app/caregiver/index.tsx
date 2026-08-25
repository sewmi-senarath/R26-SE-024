
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


const DEFAULT_INSIGHT: CaregiverInsight = {
  score: 65,
  level: 'Moderate',
  message: 'Workload is currently heavy. Tap to view AI recommendations.',
};

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

  // Load all real data 
  const loadData = useCallback(async () => {
    try {
      //  Real name from storage
      const user = await getStoredUser();
      if (user?.fullName) {
        setCaregiverName(getFirstName(user.fullName));
      }

      // Load patients, tasks and medications in parallel
      const [patientData, taskData, medData, notificationData] = await Promise.all([
        fetchPatients(),
        fetchTasks(new Date()),
        fetchMedications(),
        fetchNotifications(),   
      ]);

      // Set real patients
      setPatients(patientData.map(mapToPatient));

      // Set real tasks
      setTasks(taskData.map(mapToTask));

      // Set real stats from all API data
      const completedCount = taskData.filter((t) => t.status === 'done').length;

    
      const activeAlerts = notificationData.filter((n) => !n.acknowledged).length;

      setStats({
        patients: patientData.length,
        tasks: {
          completed: completedCount,
          total: taskData.length,
        },
        meds: medData.length,
        alerts: activeAlerts,      
      });

    } catch (error) {
      console.log('Dashboard load error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Task complete 
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

  // Refresh 
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  //  Navigation helpers (unchanged)
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