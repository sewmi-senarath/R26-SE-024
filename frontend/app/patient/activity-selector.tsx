import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';

export default function PatientHome() {
  const router = useRouter();
  const userName = 'Margaret'; // This should come from auth/context
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleMenuPress = (route: string) => {
    router.push(route);
  };

  return (
    <ScrollView className="flex-1 bg-blue-50">
      {/* Header with Greeting */}
      <View className="bg-gradient-to-b from-blue-600 to-blue-400 px-6 py-8 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="sunny" size={40} color="#fbbf24" />
              <Text className="text-5xl font-bold text-black">Welcome Back</Text>
            </View>
            {/* <Text className="text-3xl font-bold text-white">{userName}</Text> */}
          </View>
          {/* <TouchableOpacity>
            <Ionicons name="menu" size={28} color="white" />
          </TouchableOpacity> */}
        </View>
        <Text className="text-2xl text-black">{currentDate}</Text>
      </View>

      {/* Main Content */}
      <View className="px-6 py-6 gap-4">
        {/* My Daily Routine Card */}
        <TouchableOpacity
          onPress={() => handleMenuPress('/patient/daily-routine')}
          activeOpacity={0.7}
        >
          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
            <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
              <Ionicons name="checkmark-done-circle" size={28} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">My Daily Routine</Text>
              <Text className="text-lg text-gray-600">Your routine guide</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Memory Vault Card */}
        <TouchableOpacity
          onPress={() => handleMenuPress('/patient/memory-vault')}
          activeOpacity={0.7}
        >
          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
            <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
              <Ionicons name="images" size={28} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Memory Vault</Text>
              <Text className="text-lg text-gray-600">Photos & Stories</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Brain Games Card */}
        <TouchableOpacity
          onPress={() => handleMenuPress('/patient/brain-games')}
          activeOpacity={0.7}
        >
          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
            <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
              <Ionicons name="game-controller" size={28} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Brain Games</Text>
              <Text className="text-lg text-gray-600">For your Cognitive Health</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Call for Help Card - Emergency */}
        <TouchableOpacity
          onPress={() => handleMenuPress('/patient/emergency')}
          activeOpacity={0.7}
          className='mt-10'
        >
          <View className="bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 flex-row items-center gap-4">
            <View className="w-14 h-14 bg-red-500 rounded-xl items-center justify-center">
              <Ionicons name="call" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-red-600">Call for Help</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fca5a5" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View className="h-6" />
    </ScrollView>
  );
}