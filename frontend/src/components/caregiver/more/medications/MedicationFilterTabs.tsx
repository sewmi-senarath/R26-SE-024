import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { Colors } from '../../../../constants/colors';
import { MedicationTime } from '../../../../types/caregiver.types';

const TABS: { key: MedicationTime; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'morning',   label: 'Morning'   },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening',   label: 'Evening'   },
];

interface MedicationFilterTabsProps {
  active: MedicationTime;
  onChange: (tab: MedicationTime) => void;
}

export const MedicationFilterTabs: React.FC<MedicationFilterTabsProps> = ({
  active, onChange,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}
  >
    {TABS.map((tab) => {
      const isActive = active === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onChange(tab.key)}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isActive ? Colors.primary : Colors.white,
            borderWidth: 1.5,
            borderColor: isActive ? Colors.primary : Colors.border,
            shadowColor: isActive ? Colors.primary : 'transparent',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: isActive ? 3 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: isActive ? Colors.white : Colors.textSecondary,
            }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);