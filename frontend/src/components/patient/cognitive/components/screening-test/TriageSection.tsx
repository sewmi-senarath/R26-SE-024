import { getLatestFaq } from "@/src/services/patient/cognitive/dementiaService";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { AIPredictionCard } from "./AIPredictionCard";

// Results-screen block for the dementia triage. The triage needs the
// Functional Activities Questionnaire on file, so:
//   - no FAQ yet  -> show a "complete the questionnaire" button
//   - FAQ on file -> render the triage prediction card
interface TriageSectionProps {
  patientId: string;
  sessionId?: string | null;
}

export const TriageSection: React.FC<TriageSectionProps> = ({ patientId, sessionId }) => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasFaq, setHasFaq] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const faq = await getLatestFaq(patientId);
    setHasFaq(!!faq);
    setChecking(false);
  }, [patientId]);

  useEffect(() => {
    check();
  }, [check]);

  if (checking) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-6 items-center">
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  if (hasFaq) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center">
        <AIPredictionCard patientId={patientId} />
        {/* Redo the questionnaire whenever; returning here re-runs the triage
            against the latest MMSE score and the new answers. */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/patient/cognitive/assessment/functional-activities",
              params: { patientId, sessionId: sessionId ?? "" },
            })
          }
          className="self-start px-4 py-2 rounded-xl border border-gray-300"
        >
          <Text className="text-xs font-semibold text-gray-600">
            Retake questionnaire
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <Text className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
        AI Triage Prediction
      </Text>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        One more short step
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Answer 10 quick questions about day-to-day activities to get an AI triage
        result (keep an eye at home vs. see a doctor).
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/patient/cognitive/assessment/functional-activities",
            params: { patientId, sessionId: sessionId ?? "" },
          })
        }
        className="py-4 rounded-2xl items-center bg-blue-500"
      >
        <Text className="text-base font-semibold text-white">
          Complete daily-living questionnaire
        </Text>
      </TouchableOpacity>
    </View>
  );
};
