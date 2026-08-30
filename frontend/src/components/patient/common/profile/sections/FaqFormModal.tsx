import { submitFaq } from "@/src/services/patient/cognitive/dementiaService";
import {
  FAQ_CHOICES,
  FAQ_QUESTIONS,
  FaqAnswers,
} from "@/src/types/dementia.types";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// In-page version of the patient-side Daily-Living Questionnaire
// (frontend/app/patient/cognitive/assessment/functional-activities.tsx),
// used wherever a "Run Check" needs the FAQ but there's no separate route to
// navigate to for it (the profile screen, and a caregiver viewing a linked
// patient's profile) - same questions/choices/submit call, shown as a modal.
interface FaqFormModalProps {
  visible: boolean;
  patientId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const FaqFormModal: React.FC<FaqFormModalProps> = ({
  visible,
  patientId,
  onClose,
  onSubmitted,
}) => {
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
      await submitFaq(patientId, answers as FaqAnswers);
      setSubmitting(false);
      setAnswers({});
      onSubmitted();
    } catch (e: any) {
      setError(e?.message || "Could not save the questionnaire. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1 }} className="bg-gray-50">
        <View className="bg-white border-b border-gray-100 px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-gray-900">
              Daily-Living Questionnaire
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5 rounded-xl bg-gray-100">
              <Text className="text-xs font-semibold text-gray-600">Close</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-500 mt-1">
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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {FAQ_QUESTIONS.map((q, idx) => (
            <View
              key={q.key}
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
            >
              <Text className="text-base font-semibold text-gray-900 mb-1 leading-snug">
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
                      className={`px-4 py-3 rounded-xl border ${
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium leading-snug ${
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

        <View className="bg-white border-t border-gray-100 px-5 py-4">
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
                  ? "Submit & run check"
                  : `Answer all ${FAQ_QUESTIONS.length} questions`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
