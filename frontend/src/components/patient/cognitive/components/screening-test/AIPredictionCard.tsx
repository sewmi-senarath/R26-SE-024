import { predictTriage } from "@/src/services/patient/cognitive/dementiaService";
import { TriageLevel, TriagePrediction } from "@/src/types/dementia.types";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

// The dementia model returns a 2-class triage: keep monitoring at home
// ("monitor") vs. recommend a clinical review ("escalate"). This card is the
// single place that result is shown on the results screen.
const TRIAGE_STYLES: Record<
  TriageLevel,
  { bg: string; border: string; badge: string; badgeText: string; bar: string }
> = {
  monitor: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100",
    badgeText: "text-green-800",
    bar: "bg-green-500",
  },
  escalate: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100",
    badgeText: "text-red-800",
    bar: "bg-red-500",
  },
};

const LABELS: Record<TriageLevel, string> = {
  monitor: "Keep Monitoring",
  escalate: "Clinical Review Recommended",
};

const ORDER: TriageLevel[] = ["monitor", "escalate"];

interface AIPredictionCardProps {
  patientId: string;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriagePrediction | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const prediction = await predictTriage(patientId);
      setResult(prediction);
    } catch (e: any) {
      setError(e?.message || "Could not reach the prediction service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  if (loading) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-6 items-center">
        <ActivityIndicator color="#3b82f6" />
        <Text className="text-xs text-gray-400 mt-3">Running AI triage prediction…</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-5">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          AI Prediction
        </Text>
        <Text className="text-sm text-gray-500 mb-3">
          {error ?? "Prediction unavailable."} Make sure the ML service is running.
        </Text>
        <TouchableOpacity
          onPress={load}
          className="self-start px-4 py-2 rounded-xl bg-gray-100"
        >
          <Text className="text-xs font-semibold text-gray-600">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = TRIAGE_STYLES[result.triage];

  return (
    <View className={`mb-4 w-full max-w-[640px] self-center rounded-3xl border p-6 ${styles.bg} ${styles.border}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
          AI Triage Prediction
        </Text>
        <View className={`px-2.5 py-1 rounded-lg ${styles.badge}`}>
          <Text className={`text-xs font-semibold ${styles.badgeText}`}>
            {Math.round(result.confidence * 100)}% confidence
          </Text>
        </View>
      </View>

      <Text className="text-xl font-extrabold text-gray-900 mb-1">
        {LABELS[result.triage]}
      </Text>
      <Text className="text-sm text-gray-600 mb-4">{result.message}</Text>

      {/* Probability breakdown */}
      <View className="mb-1">
        {ORDER.map((level) => {
          const pct = Math.round((result.probabilities[level] ?? 0) * 100);
          return (
            <View key={level} className="flex-row items-center mb-1.5">
              <Text className="w-16 text-xs text-gray-500 capitalize">{level}</Text>
              <View className="flex-1 h-2 bg-white rounded-full overflow-hidden mr-2">
                <View
                  className={`h-full rounded-full ${TRIAGE_STYLES[level].bar}`}
                  style={{ width: `${pct}%` }}
                />
              </View>
              <Text className="w-9 text-xs text-gray-400 text-right">{pct}%</Text>
            </View>
          );
        })}
      </View>

      <Text className="text-[10px] text-gray-400 mt-2">
        Screening triage only — not a diagnosis.
      </Text>
    </View>
  );
};
