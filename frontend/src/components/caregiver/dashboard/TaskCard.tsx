import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Task } from '../../../types/caregiver.types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-5 mb-3 rounded-2xl p-4"
      style={{
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: task.completed ? Colors.successSoft : Colors.borderLight,
        borderLeftWidth: 4,
        borderLeftColor: task.completed ? Colors.success : Colors.primary,
      }}
      activeOpacity={0.85}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text
            className="font-semibold text-sm"
            style={{
              color: task.completed ? Colors.textMuted : Colors.textPrimary,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </Text>

          <View className="flex-row items-center gap-1 mt-1.5">
            <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
            <Text className="text-xs" style={{ color: Colors.textMuted }}>
              {task.patientName}
            </Text>
          </View>

          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <Text className="text-xs font-medium" style={{ color: Colors.primary }}>
                {task.time}
              </Text>
            </View>

            {task.assignee && (
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: Colors.primaryLight }}
              >
                <Text className="text-xs font-medium" style={{ color: Colors.primary }}>
                  {task.assignee}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={onComplete}
          className="w-7 h-7 rounded-full items-center justify-center ml-3"
          style={{
            backgroundColor: task.completed ? Colors.success : Colors.borderLight,
          }}
        >
          <Ionicons
            name={task.completed ? 'checkmark' : 'ellipse-outline'}
            size={16}
            color={task.completed ? Colors.white : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};