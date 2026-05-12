import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

// ── Custom Tab Icon ───────────────────────────────────────────────────────────
interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badge?: number;
}

const TabBarIcon: React.FC<TabIconProps> = ({ name, color, size, badge }) => (
  <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={size} color={color} />
    {badge && badge > 0 ? (
      <View
        style={{
          position: 'absolute',
          top: -2, right: -2,
          backgroundColor: Colors.danger,
          borderRadius: 8,
          minWidth: 16, height: 16,
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    ) : null}
  </View>
);

// ── Layout ────────────────────────────────────────────────────────────────────
export default function CaregiverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.sageGreen,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="hardware-hub"
        options={{
          title: 'Hard...',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'glasses' : 'glasses-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="behavior-logs"
        options={{
          title: 'Beha...',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'pulse' : 'pulse-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="data-ingestion"
        options={{
          title: 'Insig...',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'cloud-upload' : 'cloud-upload-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="object-tracker"
        options={{
          title: 'Obje...',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'search' : 'search-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      {/* ── Hidden original routes ── */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="patients" options={{ href: null }} />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="medications" options={{ href: null }} />
      <Tabs.Screen name="wellbeing" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="breathing" options={{ href: null }} />
      <Tabs.Screen name="hydration" options={{ href: null }} />
      <Tabs.Screen name="stretching" options={{ href: null }} />
    </Tabs>
  );
}