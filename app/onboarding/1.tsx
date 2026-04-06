import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    router.push('/onboarding/2'); 
  };

  const handleSkip = () => {
    router.push('/auth/login'); 
  };

  return (
    <ScrollView className="flex-1 bg-blue-50">
      <View className="flex-1 px-6 py-8 justify-between">
        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} className="self-end">
          <Text className="text-blue-600 font-medium text-base">Skip</Text>
        </TouchableOpacity>

        {/* Brain Icon */}
        <View className="items-center mt-0">
          {/* <View className="w-32 h-32 rounded-full bg-blue-500 justify-center items-center shadow-lg"> */}
            <Image
              source={require('../../assets/images/favicon.png')}
              className="w-5"
              // resizeMode="contain"
            />
          {/* </View> */}
        </View>

        {/* Title */}
        <View className="items-center mt-8">
          <Text className="text-2xl font-bold text-gray-800">
            Welcome to MemoCare
          </Text>
        </View>

        {/* Subtitle */}
        <View className="items-center mt-4">
          <Text className="text-center text-gray-600 text-base">
            Support memory, care,{'\n'}and connection
          </Text>
        </View>

        {/* Dot Indicators */}
        <View className="flex-row justify-center gap-2 mt-6">
          <View className={`w-2 h-2 rounded-full ${currentStep === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <View className={`w-2 h-2 rounded-full ${currentStep === 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <View className={`w-2 h-2 rounded-full ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
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