import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const memoryItems = [
  { title: 'Family Photos', subtitle: 'Photos and familiar faces', icon: 'people' },
  { title: 'Life Stories', subtitle: 'Important moments and places', icon: 'book' },
  { title: 'Voice Notes', subtitle: 'Messages from loved ones', icon: 'mic' },
] as const;

export default function MemoryScreen() {
  return (
    <ScrollView className="flex-1 bg-blue-50" contentContainerStyle={{ padding: 24, paddingBottom: 112 }}>
      <View className="mb-6">
        <Text className="text-4xl font-bold text-gray-900">Memory</Text>
        <Text className="text-lg text-gray-600 mt-2">Edit the screen in the route frontend\src\components\patient\memory\MemoryScreen.tsx to change this page</Text>
      </View>
    </ScrollView>
  );
}
