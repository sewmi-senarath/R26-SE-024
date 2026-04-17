import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { TaskFilter } from '../../../types/caregiver.types';

interface EmptyTaskStateProps {
  activeTab: TaskFilter;
}

const config = {
  all: {
    emoji: '🎉',
    icon: 'sunny-outline' as const,
    iconColor: Colors.warning,
    iconBg: Colors.warningSoft,
    title: 'No tasks today!',
    sub: 'You have a free day. Take some rest and recharge.',
  },
  todo: {
    emoji: '✅',
    icon: 'checkmark-done-circle-outline' as const,
    iconColor: Colors.success,
    iconBg: Colors.successSoft,
    title: 'All caught up!',
    sub: 'No pending tasks remaining. Great work today!',
  },
  done: {
    emoji: '📋',
    icon: 'clipboard-outline' as const,
    iconColor: Colors.primary,
    iconBg: Colors.primaryLight,
    title: 'Nothing completed yet',
    sub: 'Complete tasks and they will appear here.',
  },
};

export const EmptyTaskState: React.FC<EmptyTaskStateProps> = ({ activeTab }) => {
  const { icon, iconColor, iconBg, title, sub, emoji } = config[activeTab];

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingHorizontal: 40,
    }}>
      {/* Icon circle */}
      <View style={{
        width: 90, height: 90, borderRadius: 30,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: iconColor + '30',
      }}>
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>

      <Ionicons name={icon} size={22} color={iconColor} style={{ marginBottom: 12 }} />

      <Text style={{
        fontSize: 18, fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 8, textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 13, color: Colors.textMuted,
        textAlign: 'center', lineHeight: 20,
      }}>
        {sub}
      </Text>
    </View>
  );
};