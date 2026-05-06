import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const profileRows = [
  { label: 'Caregiver', value: 'Not assigned yet', icon: 'heart' },
  { label: 'Emergency Contact', value: 'Add contact details', icon: 'call' },
  { label: 'Care Notes', value: 'Preferences and daily support', icon: 'document-text' },
] as const;

export default function PatientProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-blue-50" contentContainerStyle={{ padding: 24, paddingBottom: 112 }}>
      <View className="bg-white rounded-2xl p-6 shadow-sm mb-5">
        <View className="flex-row items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center">
            <Ionicons name="person" size={42} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900">Patient Profile</Text>
            <Text className="text-base text-gray-600 mt-1">Personal care information</Text>
          </View>
        </View>
      </View>

      <View className="gap-4">
        {profileRows.map(row => (
          <View key={row.label} className="bg-white rounded-2xl p-5 shadow-sm flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
              <Ionicons name={row.icon} size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-500">{row.label}</Text>
              <Text className="text-xl font-bold text-gray-900 mt-1">{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
