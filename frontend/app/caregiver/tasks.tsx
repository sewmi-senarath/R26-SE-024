import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StatusBar,
  RefreshControl, TouchableOpacity, Modal,
  TouchableWithoutFeedback, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TaskProgressBar } from '../../src/components/caregiver/tasks/TaskProgressBar';
import { TaskFilterTabs }  from '../../src/components/caregiver/tasks/TaskFilterTabs';
import { TaskCard }        from '../../src/components/caregiver/tasks/TaskCard';
import { EmptyTaskState }  from '../../src/components/caregiver/tasks/EmptyTaskState';
import { AddTaskModal }    from '../../src/components/caregiver/tasks/AddTaskModal';
import { CaregiverTask, TaskFilter } from '../../src/types/caregiver.types';
import { fetchTasks, toggleTask } from '../../src/services/caregiver/taskService';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const getWeekDays = (anchor: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - 3 + i);
    return d;
  });

export default function TasksScreen() {
  const today = new Date();

  const [tasks, setTasks]               = useState<CaregiverTask[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<TaskFilter>('all');
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Load tasks from backend 
  const loadTasks = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      const data = await fetchTasks(date);
      setTasks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when date changes
  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate]);

  // Counts 
  const counts = useMemo(() => ({
    all:  tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }), [tasks]);

  // Filtered list 
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all')  return tasks;
    if (activeTab === 'todo') return tasks.filter((t) => t.status === 'todo');
    return tasks.filter((t) => t.status === 'done');
  }, [tasks, activeTab]);

  // Toggle - optimistic update + backend sync 
  const handleToggleComplete = async (id: string) => {
    // 1. Update UI immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t
      )
    );
    try {
      // 2. Sync with backend
      const updated = await toggleTask(id);
      // 3. Confirm with server value
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (error) {
      // 4. Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
            : t
        )
      );
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  // Add task - prepend to list 
  const handleAddTask = (task: CaregiverTask) => {
    setTasks((prev) => [task, ...prev]);
  };

  const shiftWeek = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks(selectedDate);
    setRefreshing(false);
  };

  const isToday = isSameDay(selectedDate, today);

  // Date Picker Modal 
  const DatePickerModal = () => (
    <Modal
      visible={showCalendar}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCalendar(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(15,23,42,0.5)',
          justifyContent: 'flex-start', paddingTop: 130,
        }}>
          <TouchableWithoutFeedback>
            <View style={{
              marginHorizontal: 20, backgroundColor: Colors.white,
              borderRadius: 24, padding: 20,
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
            }}>
              {/* Calendar header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 16,
              }}>
                <TouchableOpacity
                  onPress={() => shiftWeek(-1)}
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: Colors.borderLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>

                <Text style={{
                  fontSize: 15, fontWeight: '800', color: Colors.textPrimary,
                }}>
                  {MONTH_LABELS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>

                <TouchableOpacity
                  onPress={() => shiftWeek(1)}
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: Colors.borderLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Week strip */}
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
              }}>
                {weekDays.map((day, i) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isDayToday = isSameDay(day, today);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => { setSelectedDate(day); setShowCalendar(false); }}
                      style={{
                        alignItems: 'center', paddingVertical: 10,
                        paddingHorizontal: 6, borderRadius: 16,
                        backgroundColor: isSelected
                          ? Colors.primary
                          : isDayToday ? Colors.primaryLight : 'transparent',
                        minWidth: 38,
                      }}
                    >
                      <Text style={{
                        fontSize: 10, fontWeight: '600',
                        color: isSelected ? '#ffffffaa' : Colors.textMuted,
                        marginBottom: 4,
                      }}>
                        {DAY_LABELS[day.getDay()]}
                      </Text>
                      <Text style={{
                        fontSize: 15, fontWeight: '800',
                        color: isSelected
                          ? Colors.white
                          : isDayToday ? Colors.primary : Colors.textPrimary,
                      }}>
                        {day.getDate()}
                      </Text>
                      {isDayToday && !isSelected && (
                        <View style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: Colors.primary, marginTop: 3,
                        }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Jump to today */}
              {!isToday && (
                <TouchableOpacity
                  onPress={() => { setSelectedDate(today); setShowCalendar(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    paddingVertical: 10, borderRadius: 14,
                    backgroundColor: Colors.primaryLight,
                  }}
                >
                  <Ionicons name="today-outline" size={15} color={Colors.primary} />
                  <Text style={{
                    fontSize: 13, fontWeight: '700', color: Colors.primary,
                  }}>
                    Jump to Today
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Main Render 
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Fixed Header */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 24, fontWeight: '800', color: Colors.textPrimary,
          }}>
            Tasks
          </Text>

          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: isToday ? Colors.primaryLight : Colors.primary,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
            }}
          >
            <Ionicons
              name="calendar-outline" size={14}
              color={isToday ? Colors.primary : Colors.white}
            />
            <Text style={{
              fontSize: 12, fontWeight: '700',
              color: isToday ? Colors.primary : Colors.white,
            }}>
              {isToday
                ? 'Today'
                : `${DAY_LABELS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTH_LABELS[selectedDate.getMonth()].slice(0, 3)}`
              }
            </Text>
            <Ionicons
              name="chevron-down" size={12}
              color={isToday ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Selected date strip */}
        {!isToday && (
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: Colors.primary + '12',
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 12, marginBottom: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar" size={14} color={Colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary }}>
                {DAY_LABELS[selectedDate.getDay()]}, {selectedDate.getDate()}{' '}
                {MONTH_LABELS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedDate(today)}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>
                Back to Today
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Scrollable Content */}
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
        <TaskProgressBar completed={counts.done} total={counts.all} />
        <TaskFilterTabs activeTab={activeTab} counts={counts} onTabChange={setActiveTab} />

        {/* Loading state */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
              Loading tasks...
            </Text>
          </View>

        /* Empty or task list */
        ) : filteredTasks.length === 0 ? (
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

      {/* Date Picker Modal */}
      <DatePickerModal />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={{
          position: 'absolute', bottom: 100, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
        selectedDate={selectedDate}
      />
    </View>
  );
}