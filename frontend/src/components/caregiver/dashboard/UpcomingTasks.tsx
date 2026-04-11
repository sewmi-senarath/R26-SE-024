import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Task } from '../../../types/caregiver.types';
import { TaskCard } from './TaskCard';

interface UpcomingTasksProps {
  tasks: Task[];
  onViewSchedule?: () => void;
  onTaskPress?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
}

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
  tasks,
  onViewSchedule,
  onTaskPress,
  onTaskComplete,
}) => {
  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
          Upcoming Tasks
        </Text>
        <TouchableOpacity onPress={onViewSchedule} className="flex-row items-center gap-1">
          <Text className="text-sm font-medium" style={{ color: Colors.primary }}>
            View schedule
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <View className="mx-5 rounded-2xl p-6 items-center" style={{ backgroundColor: Colors.successSoft }}>
          <Text className="text-2xl mb-2">🎉</Text>
          <Text className="font-semibold text-sm" style={{ color: Colors.success }}>
            All tasks completed!
          </Text>
        </View>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => onTaskPress?.(task)}
            onComplete={() => onTaskComplete?.(task.id)}
          />
        ))
      )}
    </View>
  );
};