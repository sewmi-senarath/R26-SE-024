import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Onboarding3() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/role/select');
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  return (
    <View className="flex-1 bg-blue-50">
      <View className="flex-1 px-6 py-8 justify-between">
        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} className="self-end">
          <Text className="text-blue-600 font-medium text-base">Skip</Text>
        </TouchableOpacity>

        {/* People Icon */}
        <View className="items-center mt-12">
          <View className="w-32 h-32 rounded-full bg-blue-500 justify-center items-center shadow-lg">
            <Ionicons name="people" size={80} color="white" />
          </View>
        </View>

        {/* Title */}
        <View className="items-center mt-8">
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Caregiver & Family{'\n'}Collaboration
          </Text>
        </View>

        {/* Subtitle */}
        <View className="items-center mt-4">
          <Text className="text-center text-gray-600 text-base">
            Caregivers manage, patients{'\n'}engage, families stay{'\n'}connected
          </Text>
        </View>

        {/* Dot Indicators */}
        <View className="flex-row justify-center gap-2 mt-6">
          <View className="w-2 h-2 rounded-full bg-gray-300" />
          <View className="w-2 h-2 rounded-full bg-gray-300" />
          <View className="w-2 h-2 rounded-full bg-blue-600" />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          className="bg-blue-600 rounded-lg py-4 px-6 flex-row items-center justify-center mt-12 mb-4"
        >
          <Text className="text-white font-semibold text-base">Get Started</Text>
          <Ionicons name="chevron-forward" size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}