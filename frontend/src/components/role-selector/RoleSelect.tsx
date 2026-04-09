import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelect() {
  const router = useRouter();

  const handlePatientPress = () => {
    router.push('/auth/register/patient');
  };

  const handleCaregiverPress = () => {
    router.push('/auth/register/caregiver');
  };

  const handleFamilyPress = () => {
    router.push('/auth/register/family');
  };

  const handleLoginPress = () => {
    router.push('/auth/login');
  };

  return (
    <View className="flex-1 bg-blue-50">
      <View className="flex-1 px-6 py-6 justify-between">
        {/* Logo Section */}
        <View className="items-center mt-8">
          <View className="w-24 h-24 rounded-full bg-white justify-center items-center shadow-lg mb-4">
            <Image
              source={require('../../../assets/images/favicon.png')}
              className="w-24 h-24"
              resizeMode="contain"
            />
          </View>
          <Text className="text-center text-gray-600 text-sm mt-2">
            Connected care for what matters most
          </Text>
        </View>

        {/* Role Cards */}
        <View className="gap-4 mt-12 flex-1">
          {/* Patient Card */}
          <TouchableOpacity
            onPress={handlePatientPress}
            className="bg-white rounded-lg p-4 flex-row items-center shadow-sm border-l-4 border-pink-500"
          >
            <View className="w-12 h-12 rounded-full bg-pink-100 justify-center items-center mr-4">
              <Ionicons name="heart" size={24} color="#ec4899" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                I am a Patient
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                I need help with my daily routine
              </Text>
            </View>
          </TouchableOpacity>

          {/* Caregiver Card */}
          <TouchableOpacity
            onPress={handleCaregiverPress}
            className="bg-white rounded-lg p-4 flex-row items-center shadow-sm border-l-4 border-blue-500"
          >
            <View className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center mr-4">
              <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                I am a Caregiver
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                I manage care for others
              </Text>
            </View>
          </TouchableOpacity>

          {/* Family Card */}
          <TouchableOpacity
            onPress={handleFamilyPress}
            className="bg-white rounded-lg p-4 flex-row items-center shadow-sm border-l-4 border-cyan-500"
          >
            <View className="w-12 h-12 rounded-full bg-cyan-100 justify-center items-center mr-4">
              <Ionicons name="people" size={24} color="#06b6d4" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                I am Family
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                I want to stay connected
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center mb-4">
          <Text className="text-gray-600 text-sm">Already have an account?</Text>
          <TouchableOpacity onPress={handleLoginPress}>
            <Text className="text-blue-600 font-semibold text-sm">Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}