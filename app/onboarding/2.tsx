import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Onboarding2() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/3');
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  return (
    <ScrollView className="flex-1 bg-blue-50">
      <View className="flex-1 px-6 py-8 justify-between min-h-screen">
        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} className="self-end">
          <Text className="text-blue-600 font-medium text-base">Skip</Text>
        </TouchableOpacity>

        {/* Heartbeat Icon */}
        <View className="items-center mt-12">
          <View className="w-32 h-32 rounded-full bg-blue-500 justify-center items-center shadow-lg">
            <Ionicons name="pulse" size={80} color="white" />
          </View>
        </View>

        {/* Title */}
        <View className="items-center mt-8">
          <Text className="text-2xl font-bold text-gray-800 text-center">
            Personalized{'\n'}Memory & Cognitive{'\n'}Support
          </Text>
        </View>

        {/* Subtitle */}
        <View className="items-center mt-4">
          <Text className="text-center text-gray-600 text-base">
            Daily Reminders and Activities adapted to each user's{'\n'}cognitive ability
          </Text>
        </View>

        {/* Dot Indicators */}
        <View className="flex-row justify-center gap-2 mt-6">
          <View className="w-2 h-2 rounded-full bg-gray-300" />
          <View className="w-2 h-2 rounded-full bg-blue-600" />
          <View className="w-2 h-2 rounded-full bg-gray-300" />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="bg-blue-600 rounded-lg py-4 px-6 flex-row items-center justify-center mt-12 mb-4"
        >
          <Text className="text-white font-semibold text-base">Next</Text>
          <Ionicons name="chevron-forward" size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}