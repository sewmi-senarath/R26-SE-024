import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { CaregiverTask } from '../../../types/caregiver.types';

const categoryConfig = {
  bathing:    { icon: 'water-outline'               as const, color: '#06B6D4', bg: '#ECFEFF' },
  feeding:    { icon: 'restaurant-outline'          as const, color: '#F97316', bg: '#FFF7ED' },
  exercise:   { icon: 'fitness-outline'             as const, color: '#8B5CF6', bg: '#F5F3FF' },
  medication: { icon: 'medical-outline'             as const, color: '#EF4444', bg: '#FEF2F2' },
  outdoor:    { icon: 'leaf-outline'                as const, color: '#22C55E', bg: '#F0FDF4' },
  other:      { icon: 'ellipsis-horizontal-outline' as const, color: '#94A3B8', bg: '#F8FAFC' },
};

const priorityConfig = {
  high:   { color: '#EF4444', label: 'High' },
  medium: { color: '#F97316', label: 'Med'  },
  low:    { color: '#22C55E', label: 'Low'  },
};

interface TaskCardProps {
  task: CaregiverTask;
  onToggleComplete: (id: string) => void;
  onPress: (task: CaregiverTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task, onToggleComplete, onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDone = task.status === 'done';
  const cat    = categoryConfig[task.category];
  const pri    = priorityConfig[task.priority];

  const handleCheckPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80,  useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onToggleComplete(task.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(task)}
        activeOpacity={0.88}
        style={{
          marginHorizontal: 20,
          marginBottom: 10,
          backgroundColor: isDone ? '#FAFBFF' : Colors.white,
          borderRadius: 20,
          padding: 14,
          borderWidth: 1.5,
          borderColor: isDone ? Colors.borderLight : Colors.border,
          borderLeftWidth: 4,
          borderLeftColor: isDone ? Colors.success : cat.color,
          shadowColor: isDone ? 'transparent' : cat.color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: isDone ? 0 : 2,
          opacity: isDone ? 0.8 : 1,
        }}
      >
        {/* ── Main row ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

          {/* Category icon */}
          <View style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: isDone ? Colors.borderLight : cat.bg,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Ionicons name={cat.icon} size={20} color={isDone ? Colors.textMuted : cat.color} />
          </View>

          {/* ── Content ── */}
          <View style={{ flex: 1 }}>

            {/* Title + priority */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8,
                  color: isDone ? Colors.textMuted : Colors.textPrimary,
                  textDecorationLine: isDone ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </Text>
              {!isDone && (
                <View style={{
                  paddingHorizontal: 7, paddingVertical: 2,
                  borderRadius: 8, backgroundColor: pri.color + '18',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: pri.color }}>
                    {pri.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Patient */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <View style={{
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: task.patientColor + '22',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: task.patientColor }}>
                  {task.patientInitials}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: '500' }}>
                {task.patientName}
              </Text>
            </View>

            {/* Time chip only — assignee moved to main row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: isDone ? Colors.borderLight : Colors.primaryLight,
                paddingHorizontal: 8, paddingVertical: 4,
                borderRadius: 10,
              }}>
                <Ionicons
                  name="time-outline" size={11}
                  color={isDone ? Colors.textMuted : Colors.primary}
                />
                <Text style={{
                  fontSize: 11, fontWeight: '600',
                  color: isDone ? Colors.textMuted : Colors.primary,
                }}>
                  {task.time}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Right side: assignee + checkbox on SAME vertical line ── */}
          <View style={{
            alignItems: 'center',   // ← centres both horizontally
            gap: 8,                 // ← space between assignee and checkbox
            flexShrink: 0,
          }}>
            {/* Assignee bubble */}
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: isDone ? Colors.borderLight : Colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: 9, fontWeight: '800',
                color: isDone ? Colors.textMuted : Colors.white,
              }}>
                {task.assignee}
              </Text>
            </View>

            {/* Checkbox */}
            <TouchableOpacity
              onPress={handleCheckPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 28, height: 28, borderRadius: 14,
                borderWidth: 2,
                borderColor: isDone ? Colors.success : Colors.border,
                backgroundColor: isDone ? Colors.success : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isDone && (
                <Ionicons name="checkmark" size={15} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};