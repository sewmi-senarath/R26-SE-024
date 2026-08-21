import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { PATIENT_TABS } from '../../../src/navigation/patientTabs';

type TabBarIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
};

function PatientTabBarIcon({ name, color, size }: TabBarIconProps) {
  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function PatientTabsLayout() {
  return (
    <Tabs
      initialRouteName="activity-selector"
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
        },
        tabBarLabel: ({ color, children }) => (
          <Text style={{ color, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{children}</Text>
        ),
      }}
    >
      {PATIENT_TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <PatientTabBarIcon
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                color={color}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
