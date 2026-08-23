import { RiskChecklistForm } from "@/src/components/patient/cognitive/components/risk-screener/RiskChecklistForm";
import { RiskResultCard } from "@/src/components/patient/cognitive/components/risk-screener/RiskResultCard";
import { screenRisk } from "@/src/services/patient/cognitive/dementiaService";
import { RiskChecklist, RiskResult } from "@/src/types/dementia.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/src/constants/colors";

export default function DementiaScreeningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
    patientAge?: string;
  }>();

  const patientId = params.patientId || "";
  const patientName = params.patientName || "this patient";
  const patientAge = params.patientAge ? Number(params.patientAge) : undefined;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);

  const handleSubmit = async (checklist: RiskChecklist) => {
    if (!patientId) {
      Alert.alert("Missing patient", "No patient selected for screening.");
      return;
    }
    setLoading(true);
    try {
      const res = await screenRisk(patientId, checklist);
      setResult(res);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not connect. Make sure the backend and ML service are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>Dementia Risk Screening</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.textPrimary }}>
            {patientName}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-gray-500 mb-6">
          Answer based on what you&apos;ve observed recently — no cognitive test needed for {patientName}.
        </Text>

        {result ? (
          <RiskResultCard result={result} onRetake={() => setResult(null)} />
        ) : (
          <RiskChecklistForm
            initialAge={patientAge}
            loading={loading}
            onSubmit={handleSubmit}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
