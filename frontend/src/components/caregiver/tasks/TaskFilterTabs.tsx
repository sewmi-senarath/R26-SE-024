import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../../../constants/colors';
import { TaskFilter } from '../../../types/caregiver.types';

interface Tab {
  key: TaskFilter;
  label: string;
  count: number;
}

interface TaskFilterTabsProps {
  activeTab: TaskFilter;
  counts: { all: number; todo: number; done: number };
  onTabChange: (tab: TaskFilter) => void;
}

export const TaskFilterTabs: React.FC<TaskFilterTabsProps> = ({
  activeTab,
  counts,
  onTabChange,
}) => {
  const tabs: Tab[] = [
    { key: 'all',  label: 'All',    count: counts.all  },
    { key: 'todo', label: 'To Do',  count: counts.todo },
    { key: 'done', label: 'Done',   count: counts.done },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: Colors.borderLight,
        borderRadius: 16,
        padding: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: isActive ? Colors.white : 'transparent',
              shadowColor: isActive ? Colors.primary : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.1 : 0,
              shadowRadius: 6,
              elevation: isActive ? 2 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? Colors.primary : Colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isActive ? Colors.primary : Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isActive ? Colors.white : Colors.textMuted,
                  }}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};