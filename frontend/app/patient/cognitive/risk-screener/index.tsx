import { getMe, getStoredUser } from "@/src/api/authApi";
import { RiskChecklistForm } from "@/src/components/patient/cognitive/components/risk-screener/RiskChecklistForm";
import { RiskResultCard } from "@/src/components/patient/cognitive/components/risk-screener/RiskResultCard";
import { screenRisk } from "@/src/services/patient/cognitive/dementiaService";
import { RiskChecklist, RiskResult } from "@/src/types/dementia.types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function RiskScreenerScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await getStoredUser();
      const meRes = await getMe();
      const user = meRes?.success ? meRes.data?.user : stored;
      if (user?.id) setUserId(user.id);
      if (user?.age) setAge(Number(user.age));
      if (user?.gender) setGender(user.gender);
    })();
  }, []);

  const handleSubmit = async (checklist: RiskChecklist) => {
    if (!userId) {
      Alert.alert("Not signed in", "Please log in again and retry.");
      return;
    }
    setLoading(true);
    try {
      const res = await screenRisk(userId, checklist);
      setResult(res);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not connect. Make sure the backend and ML service are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Quick Risk Check
        </Text>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Behavioral Screening</Text>
        <Text className="text-sm text-gray-500 mb-6">
          No test required — just a few quick questions about recent behavior.
        </Text>

        {result ? (
          <RiskResultCard
            result={result}
            onRetake={() => setResult(null)}
            onTakeFullAssessment={() => router.push("/patient/cognitive/assessment")}
          />
        ) : (
          <RiskChecklistForm
            initialAge={age}
            initialGender={gender}
            loading={loading}
            onSubmit={handleSubmit}
          />
        )}

        <TouchableOpacity onPress={() => router.back()} className="items-center py-2">
          <Text className="text-sm text-gray-400">Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
