import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { TaskFilter } from '../../../types/caregiver.types';

interface Tab {
  key: TaskFilter;
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  activeColor: string;
  activeBg: string;
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
    {
      key: 'all',
      label: 'All',
      count: counts.all,
      icon: 'list-outline',
      activeColor: Colors.primary,
      activeBg: Colors.primaryLight,
    },
    {
      key: 'todo',
      label: 'To Do',
      count: counts.todo,
      icon: 'ellipse-outline',
      activeColor: Colors.warning,
      activeBg: Colors.warningSoft,
    },
    {
      key: 'done',
      label: 'Done',
      count: counts.done,
      icon: 'checkmark-circle-outline',
      activeColor: Colors.success,
      activeBg: Colors.successSoft,
    },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: Colors.borderLight,
        borderRadius: 18,
        padding: 4,
        gap: 4,
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
              gap: 5,
              paddingVertical: 11,
              borderRadius: 14,
              backgroundColor: isActive ? Colors.white : 'transparent',
              shadowColor: isActive ? tab.activeColor : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isActive ? 0.12 : 0,
              shadowRadius: 6,
              elevation: isActive ? 2 : 0,
            }}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={isActive ? tab.activeColor : Colors.textMuted}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: isActive ? '800' : '500',
                color: isActive ? tab.activeColor : Colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={{
                  minWidth: 20, height: 20,
                  borderRadius: 10,
                  backgroundColor: isActive ? tab.activeColor : Colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: '800',
                  color: isActive ? Colors.white : Colors.textMuted,
                }}>
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