import { PatientReportView } from "@/src/components/patient/cognitive/components/report/PatientReportView";
import { Colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function CaregiverPatientReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string; patientName?: string }>();
  const patientId = params.patientId || "";
  const patientName = params.patientName || "Patient";

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
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>Cognitive Report</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.textPrimary }}>{patientName}</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {patientId ? (
          <PatientReportView patientId={patientId} patientName={patientName} />
        ) : (
          <Text style={{ color: Colors.textMuted, textAlign: "center", marginTop: 40 }}>
            No patient selected.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
