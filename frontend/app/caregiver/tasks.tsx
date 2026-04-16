import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TaskProgressBar } from '../../src/components/caregiver/tasks/TaskProgressBar';
import { TaskFilterTabs } from '../../src/components/caregiver/tasks/TaskFilterTabs';
import { TaskCard } from '../../src/components/caregiver/tasks/TaskCard';
import { EmptyTaskState } from '../../src/components/caregiver/tasks/EmptyTaskState';
import { CaregiverTask, TaskFilter } from '../../src/types/caregiver.types';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_TASKS: CaregiverTask[] = [
  {
    id: '1',
    title: 'Morning Bathing Assist',
    patientName: 'Margaret Hughes',
    patientInitials: 'MH',
    patientColor: '#F97316',
    time: '09:30 AM',
    status: 'done',
    priority: 'high',
    assignee: 'SJ',
    category: 'bathing',
  },
  {
    id: '2',
    title: 'Lunch Feeding',
    patientName: 'Margaret Hughes',
    patientInitials: 'MH',
    patientColor: '#F97316',
    time: '12:00 PM',
    status: 'done',
    priority: 'high',
    assignee: 'SJ',
    category: 'feeding',
  },
  {
    id: '3',
    title: 'Cognitive Exercises',
    patientName: 'Robert Chen',
    patientInitials: 'RC',
    patientColor: '#22C55E',
    time: '02:30 PM',
    status: 'todo',
    priority: 'medium',
    assignee: 'DK',
    category: 'exercise',
  },
  {
    id: '4',
    title: 'Administer Evening Meds',
    patientName: 'Eleanor Vance',
    patientInitials: 'EV',
    patientColor: '#4F8EF7',
    time: '06:00 PM',
    status: 'todo',
    priority: 'high',
    assignee: 'SJ',
    category: 'medication',
  },
  {
    id: '5',
    title: 'Light Walk in Garden',
    patientName: 'Arthur Pendelton',
    patientInitials: 'AP',
    patientColor: '#8B5CF6',
    time: '04:00 PM',
    status: 'todo',
    priority: 'low',
    assignee: 'SJ',
    category: 'outdoor',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const [tasks, setTasks]       = useState<CaregiverTask[]>(MOCK_TASKS);
  const [activeTab, setActiveTab] = useState<TaskFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // ── Counts for tab badges ────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:  tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }), [tasks]);

  // ── Filtered list based on active tab ───────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all')  return tasks;
    if (activeTab === 'todo') return tasks.filter((t) => t.status === 'todo');
    return tasks.filter((t) => t.status === 'done');
  }, [tasks, activeTab]);

  // ── Toggle task complete/incomplete ─────────────────────────────────────────
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t,
      ),
    );
  };

  // ── Pull-to-refresh ──────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
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
        {/* Title row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 24, fontWeight: '800',
              color: Colors.textPrimary,
            }}
          >
            Tasks
          </Text>

          {/* Today badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: Colors.primaryLight,
              paddingHorizontal: 12, paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
            <Text
              style={{
                fontSize: 12, fontWeight: '700', color: Colors.primary,
              }}
            >
              Today
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
        {/* ── Progress Bar ── */}
        <TaskProgressBar
          completed={counts.done}
          total={counts.all}
        />

        {/* ── Filter Tabs ── */}
        <TaskFilterTabs
          activeTab={activeTab}
          counts={counts}
          onTabChange={setActiveTab}
        />

        {/* ── Task List ── */}
        {filteredTasks.length === 0 ? (
          <EmptyTaskState activeTab={activeTab} />
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onPress={(t) => console.log('Task pressed:', t.title)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}