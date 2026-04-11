import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Routine } from '../../../types/caregiver.types';

interface RoutineItemProps {
  routine: Routine;
  onToggle: (id: string) => void;
}

export const RoutineItem: React.FC<RoutineItemProps> = ({ routine, onToggle }) => {
  return (
    <View
      className="flex-row items-center px-4 py-3 mb-2 rounded-2xl"
      style={{
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: routine.completed ? Colors.successSoft : Colors.borderLight,
      }}
    >
      <TouchableOpacity
        onPress={() => onToggle(routine.id)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: routine.completed ? Colors.success : Colors.border,
          backgroundColor: routine.completed ? Colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {routine.completed && (
          <Ionicons name="checkmark" size={14} color={Colors.white} />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        <Text
          className="text-sm font-semibold"
          style={{
            color: routine.completed ? Colors.textMuted : Colors.textPrimary,
            textDecorationLine: routine.completed ? 'line-through' : 'none',
          }}
        >
          {routine.title}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: Colors.textMuted }}>
          {routine.time}
        </Text>
      </View>
    </View>
  );
};