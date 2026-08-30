import { predictTriage } from "@/src/services/patient/cognitive/dementiaService";
import { TriageLevel, TriagePrediction } from "@/src/types/dementia.types";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
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
  monitor: "Keep an eye at home",
  escalate: "See a doctor",
};

// Short version for the probability breakdown rows.
const SHORT_LABELS: Record<TriageLevel, string> = {
  monitor: "At home",
  escalate: "See a doctor",
};

const ORDER: TriageLevel[] = ["monitor", "escalate"];

interface AIPredictionCardProps {
  patientId: string;
  // Default true: fetch immediately on mount, matching the original results-
  // screen behavior exactly. Pass false for an on-demand "Run Check" button
  // instead (profile screen, caregiver view) - nothing fetches until pressed.
  autoRun?: boolean;
  // Called instead of the generic error message when the backend responds
  // 409 FAQ_REQUIRED, if provided. Falls back to the generic message otherwise.
  onFaqRequired?: () => void;
}

// Imperative handle so a parent (e.g. after the caller closes an FAQ modal
// opened via onFaqRequired) can trigger a re-run without disturbing the
// `autoRun`/idle-vs-result UI state - just calls the same `load()` again.
export interface AIPredictionCardHandle {
  run: () => void;
}

export const AIPredictionCard = forwardRef<AIPredictionCardHandle, AIPredictionCardProps>(({
  patientId,
  autoRun = true,
  onFaqRequired,
}, ref) => {
  const [loading, setLoading] = useState(autoRun);
  const [error, setError] = useState<string | null>(null);
  const [faqRequired, setFaqRequired] = useState(false);
  const [result, setResult] = useState<TriagePrediction | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setFaqRequired(false);
    try {
      const prediction = await predictTriage(patientId);
      setResult(prediction);
    } catch (e: any) {
      if (e?.code === "FAQ_REQUIRED") {
        setFaqRequired(true);
        if (onFaqRequired) onFaqRequired();
      } else {
        setError(e?.message || "Could not reach the prediction service.");
      }
    } finally {
      setLoading(false);
      setHasRun(true);
    }
  };

  useImperativeHandle(ref, () => ({ run: load }));

  useEffect(() => {
    if (patientId && autoRun) load();
  }, [patientId, autoRun]);

  if (loading) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-6 items-center">
        <ActivityIndicator color="#3b82f6" />
        <Text className="text-xs text-gray-400 mt-3">Running AI triage prediction…</Text>
      </View>
    );
  }

  // Not auto-run and nothing has happened yet - show the idle "Run" state.
  if (!autoRun && !hasRun) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-5 items-start">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          AI Triage Check
        </Text>
        <Text className="text-sm text-gray-500 mb-3">
          Run the AI triage check using the latest completed assessment.
        </Text>
        <TouchableOpacity
          onPress={load}
          className="self-start px-4 py-2 rounded-xl bg-blue-500"
        >
          <Text className="text-xs font-semibold text-white">Run Check</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (faqRequired && !onFaqRequired) {
    return (
      <View className="mb-4 w-full max-w-[640px] self-center rounded-3xl border border-gray-100 bg-white p-5">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          AI Prediction
        </Text>
        <Text className="text-sm text-gray-500 mb-3">
          Complete the daily-living questionnaire to get a triage result.
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

  if (error || !result) {
    if (faqRequired) {
      // onFaqRequired already fired above; render nothing while the caller
      // (e.g. a modal) handles it, to avoid flashing a generic error first.
      return null;
    }
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
              <Text className="w-24 text-xs text-gray-500">{SHORT_LABELS[level]}</Text>
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
        Screening triage only - not a diagnosis.
      </Text>

      {!autoRun && (
        <TouchableOpacity
          onPress={load}
          className="self-start mt-3 px-4 py-2 rounded-xl bg-white/70"
        >
          <Text className="text-xs font-semibold text-gray-700">Re-run Check</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

AIPredictionCard.displayName = "AIPredictionCard";
