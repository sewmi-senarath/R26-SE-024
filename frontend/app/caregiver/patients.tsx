import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function PatientsScreen() {
  return (
    <View className="flex-1 items-center justify-center"
      style={{ backgroundColor: Colors.background }}>
      <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
        Patients Screen
      </Text>
      <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Coming soon...</Text>
    </View>
  );
}