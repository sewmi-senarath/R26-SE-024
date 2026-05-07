import { getMe } from "@/src/api/authApi";
import { useAssessmentSession } from "@/src/hooks/useAssessmentSession";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AssessmentWelcome() {
  const router = useRouter();
  const { startSession } = useAssessmentSession();

  const handleStart = async () => {
    try {
      const meRes = await getMe();
      if (!meRes?.success) {
        throw new Error(meRes?.message || "Failed to load user");
      }

      const me = meRes.data.user;

      const patientId = me.role === "patient" ? me.id : undefined;
      const caregiverId =
        me.role === "caregiver" ? me.id : me.assignedCaregiverId;

      if (!patientId || !caregiverId) {
        throw new Error("Missing patient/caregiver ID");
      }

      await startSession({
        patientId,
        caregiverId,
        administrationMode: "self",
      });
      router.replace("/patient/cognitive/assessment/0");
    } catch (error) {
      console.error("Session start failed:", error);
      alert("Failed to start assessment. Please check your connection.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 justify-center items-center px-8">
        <View className="flex-row gap-4 mb-10">
          <View className="w-16 h-16 rounded-2xl bg-blue-100 items-center justify-center">
            <Text className="text-2xl">✓</Text>
          </View>
          <View className="w-16 h-16 rounded-2xl bg-blue-100 items-center justify-center">
            <Text className="text-2xl">👤</Text>
          </View>
        </View>

        <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
          Let us Begin a Quick Check
        </Text>
        <Text className="text-base text-gray-500 text-center leading-relaxed mb-12">
          We will ask you a few simple questions to understand how we can best
          support you. This will only take a few minutes.
        </Text>

        <TouchableOpacity
          onPress={handleStart}
          className="w-full bg-blue-500 py-4 rounded-2xl items-center"
        >
          <Text className="text-white font-semibold text-base">Start Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
