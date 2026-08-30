import { submitFaq } from "@/src/services/patient/cognitive/dementiaService";
import {
  FAQ_CHOICES,
  FAQ_QUESTIONS,
  FaqAnswers,
} from "@/src/types/dementia.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Functional Activities Questionnaire - shown after the MMSE results screen,
// reached from the "Complete daily-living questionnaire" button. 10 items,
// each rated 0-3 by whoever is with the patient. On submit it saves the FAQ
// and returns to the results screen, which then shows the AI triage.
export default function FunctionalActivitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string; sessionId?: string }>();
  const patientId = typeof params.patientId === "string" ? params.patientId : "";
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId ? params.sessionId : null;

  const [answers, setAnswers] = useState<Partial<FaqAnswers>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === FAQ_QUESTIONS.length;
  const progressPct = useMemo(
    () => Math.round((answeredCount / FAQ_QUESTIONS.length) * 100),
    [answeredCount],
  );

  const select = (key: keyof FaqAnswers, value: number) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    if (!allAnswered || !patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitFaq(patientId, answers as FaqAnswers, sessionId);
      router.replace("/patient/cognitive/assessment/results");
    } catch (e: any) {
      setError(e?.message || "Could not save the questionnaire. Try again.");
      setSubmitting(false);
    }
  };

  if (!patientId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-base text-gray-600 text-center mb-4">
          Missing patient details. Go back to the results screen and try again.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/patient/cognitive/assessment/results")}
          className="px-5 py-3 rounded-2xl bg-blue-500"
        >
          <Text className="text-white font-semibold">Back to results</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Cap content to a readable column and centre it on wide (web) viewports.
  const column = "w-full max-w-[640px] self-center";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header + progress (full-bleed bar, centred inner column) */}
      <View className="bg-white border-b border-gray-100">
        <View className={`${column} px-6 pt-4 pb-3`}>
          <Text className="text-lg font-extrabold text-gray-900">Daily-Living Questionnaire</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Compared with a few years ago, how does the patient manage each of these
            on their own now?
          </Text>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </View>
          <Text className="text-xs text-gray-400 mt-1">
            {answeredCount} of {FAQ_QUESTIONS.length} answered
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          width: "100%",
          maxWidth: 640,
          alignSelf: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {FAQ_QUESTIONS.map((q, idx) => (
          <View
            key={q.key}
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
          >
            <Text className="text-sm font-semibold text-gray-900 mb-0.5">
              {idx + 1}. {q.prompt}
            </Text>
            <Text className="text-xs text-gray-400 mb-3">{q.checks}</Text>
            <View className="gap-2">
              {FAQ_CHOICES.map((choice) => {
                const isSelected = answers[q.key] === choice.value;
                return (
                  <TouchableOpacity
                    key={choice.value}
                    activeOpacity={0.7}
                    onPress={() => select(q.key, choice.value)}
                    className={`p-3 rounded-xl border ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {choice.value} · {choice.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {error && (
          <Text className="text-sm text-red-600 text-center mb-2">{error}</Text>
        )}
      </ScrollView>

      {/* Submit bar (full-bleed bar, centred inner column) */}
      <View className="bg-white border-t border-gray-100">
        <View className={`${column} px-6 py-4`}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!allAnswered || submitting}
            onPress={onSubmit}
            className={`py-4 rounded-2xl items-center ${
              allAnswered && !submitting ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className={`text-base font-semibold ${
                  allAnswered ? "text-white" : "text-gray-400"
                }`}
              >
                {allAnswered
                  ? "Submit & see triage"
                  : `Answer all ${FAQ_QUESTIONS.length} questions`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
