import { predictSeverity } from "@/src/services/patient/cognitive/dementiaService";
import { SeverityLevel, SeverityPrediction } from "@/src/types/dementia.types";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

// Severity colour map for the ML prediction card - this card is the single
// place a severity band is shown on the results screen.
const SEVERITY_STYLES: Record<
  SeverityLevel,
  { bg: string; border: string; badge: string; badgeText: string; bar: string; dot: string }
> = {
  none: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100",
    badgeText: "text-green-800",
    bar: "bg-green-500",
    dot: "bg-green-500",
  },
  mild: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100",
    badgeText: "text-amber-800",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  moderate: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100",
    badgeText: "text-orange-800",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
  },
  severe: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100",
    badgeText: "text-red-800",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
};

const LABELS: Record<SeverityLevel, string> = {
  none: "No Impairment",
  mild: "Mild Impairment",
  moderate: "Moderate Impairment",
  severe: "Severe Impairment",
};

const ORDER: SeverityLevel[] = ["none", "mild", "moderate", "severe"];

interface AIPredictionCardProps {
  patientId: string;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeverityPrediction | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const prediction = await predictSeverity(patientId);
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
      <View className="mx-6 mb-4 rounded-3xl border border-gray-100 bg-white p-6 items-center">
        <ActivityIndicator color="#3b82f6" />
        <Text className="text-xs text-gray-400 mt-3">Running AI severity prediction…</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View className="mx-6 mb-4 rounded-3xl border border-gray-100 bg-white p-5">
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

  const styles = SEVERITY_STYLES[result.severity];

  return (
    <View className={`mx-6 mb-4 rounded-3xl border p-6 ${styles.bg} ${styles.border}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
          AI Severity Prediction
        </Text>
        <View className={`px-2.5 py-1 rounded-lg ${styles.badge}`}>
          <Text className={`text-xs font-semibold ${styles.badgeText}`}>
            {Math.round(result.confidence * 100)}% confidence
          </Text>
        </View>
      </View>

      <Text className="text-xl font-extrabold text-gray-900 mb-1">
        {LABELS[result.severity]}
      </Text>
      <Text className="text-sm text-gray-600 mb-4">{result.message}</Text>

      {/* Probability breakdown */}
      <View className="mb-4">
        {ORDER.map((level) => {
          const pct = Math.round((result.probabilities[level] ?? 0) * 100);
          return (
            <View key={level} className="flex-row items-center mb-1.5">
              <Text className="w-20 text-xs text-gray-500">{LABELS[level].replace(" Impairment", "")}</Text>
              <View className="flex-1 h-2 bg-white rounded-full overflow-hidden mr-2">
                <View
                  className={`h-full rounded-full ${SEVERITY_STYLES[level].bar}`}
                  style={{ width: `${pct}%` }}
                />
              </View>
              <Text className="w-9 text-xs text-gray-400 text-right">{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
