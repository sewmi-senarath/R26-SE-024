import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../../constants/colors';
import { NotificationSeverity } from '../../../../types/caregiver.types';

interface SummaryItem {
  type: NotificationSeverity;
  count: number;
  color: string;
  bg: string;
}

interface NotificationSummaryBarProps {
  counts: Record<NotificationSeverity, number>;
  active: NotificationSeverity | 'all';
  onPress: (type: NotificationSeverity | 'all') => void;
}

export const NotificationSummaryBar: React.FC<NotificationSummaryBarProps> = ({
  counts, active, onPress,
}) => {
  const items: SummaryItem[] = [
    { type: 'urgent',  count: counts.urgent,  color: Colors.danger,  bg: Colors.dangerSoft  },
    { type: 'warning', count: counts.warning, color: Colors.warning, bg: Colors.warningSoft },
    { type: 'info',    count: counts.info,    color: Colors.primary, bg: Colors.primaryLight },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 16 }}>
      {items.map((item) => {
        const isActive = active === item.type;
        return (
          <TouchableOpacity
            key={item.type}
            onPress={() => onPress(isActive ? 'all' : item.type)}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: isActive ? item.color : Colors.white,
              borderWidth: 1.5,
              borderColor: isActive ? item.color : Colors.borderLight,
              shadowColor: isActive ? item.color : 'transparent',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: isActive ? 3 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 22, fontWeight: '900',
                color: isActive ? Colors.white : item.color,
              }}
            >
              {item.count}
            </Text>
            <Text
              style={{
                fontSize: 11, fontWeight: '600',
                color: isActive ? '#ffffffcc' : Colors.textMuted,
                textTransform: 'capitalize', marginTop: 2,
              }}
            >
              {item.type === 'urgent' ? 'Urgent' : item.type === 'warning' ? 'Warnings' : 'Info'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};