import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { TabBarIcon } from '../../src/components/caregiver/TabBarIcon';

export default function CaregiverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,         

        // Active/inactive colors 
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',

        // Tab bar styling
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 20,              // Android shadow
          shadowColor: '#4F8EF7',     // iOS shadow
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',       // float above content
        },

        // Label styling 
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* ── Home ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'grid' : 'grid-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ── Patients ── */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'people' : 'people-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ── Tasks ── */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
              color={color}
              size={size}
              badge={4}              
            />
          ),
        }}
      />

      {/* ── Insights ── */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ── More ── */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'menu' : 'menu-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}