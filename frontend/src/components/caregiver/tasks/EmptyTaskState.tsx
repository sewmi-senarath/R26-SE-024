import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { TaskFilter } from '../../../types/caregiver.types';

interface EmptyTaskStateProps {
  activeTab: TaskFilter;
}

const config = {
  all:  { emoji: '🎉', title: 'No tasks today!',       sub: 'Enjoy your free day.'                  },
  todo: { emoji: '✅', title: 'All caught up!',         sub: 'No pending tasks remaining.'           },
  done: { emoji: '📋', title: 'Nothing completed yet',  sub: 'Complete tasks to see them here.'      },
};

export const EmptyTaskState: React.FC<EmptyTaskStateProps> = ({ activeTab }) => {
  const { emoji, title, sub } = config[activeTab];
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: Colors.primaryLight,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 36 }}>{emoji}</Text>
      </View>
      <Text
        style={{
          fontSize: 17, fontWeight: '800',
          color: Colors.textPrimary,
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13, color: Colors.textMuted,
          textAlign: 'center', lineHeight: 20,
        }}
      >
        {sub}
      </Text>
    </View>
  );
};