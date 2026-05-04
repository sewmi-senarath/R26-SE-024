import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Question } from "@/src/types/assessment.types";

interface Props {
  question: Question;
  onAnswer: (recalled: string[]) => void;
  secondsLeft: number;
  timeLimit: number | null;
}

export function WordRecallRenderer({
  question,
  onAnswer,
  secondsLeft,
  timeLimit,
}: Props) {
  const [recalled, setRecalled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setRecalled({});
  }, [question.id]);

  const isRegistration = question.type === "word_recall_display";
  const isRecall = question.type === "word_recall_input";

  // Registration: show words during timer, then mark.
  // Recall: never show words first; directly mark recalled words.
  const phase = useMemo<"showing" | "marking">(() => {
    if (isRecall) return "marking";
    return secondsLeft > 0 ? "showing" : "marking";
  }, [isRecall, secondsLeft]);

  const words = question.words ?? [];

  const toggle = (word: string) => {
    if (phase !== "marking") return;

    const updated = { ...recalled, [word]: !recalled[word] };
    setRecalled(updated);

    const recalledWords = Object.entries(updated)
      .filter(([, checked]) => checked)
      .map(([w]) => w);

    onAnswer(recalledWords);
  };

  return (
    <View className="px-6 gap-4">
      {phase === "showing" ? (
        <View className="gap-3">
          <Text className="text-sm text-gray-500 text-center mb-2">
            Memorise these words ({secondsLeft}s remaining)
          </Text>

          {words.map((word) => (
            <View key={word} className="bg-blue-50 rounded-2xl p-5">
              <Text className="text-2xl font-semibold text-blue-700 text-center tracking-wide">
                {word}
              </Text>
            </View>
          ))}

          {!!timeLimit && (
            <Text className="text-xs text-gray-400 text-center mt-1">
              Caregiver marking will appear when timer reaches 0
            </Text>
          )}
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-gray-500 text-center mb-2">
            {isRegistration
              ? "Tap each word repeated correctly"
              : "Tap each word the patient recalled correctly"}
          </Text>

          {words.map((word) => {
            const isRecalled = recalled[word] ?? false;
            return (
              <TouchableOpacity
                key={word}
                onPress={() => toggle(word)}
                className={`p-4 rounded-2xl border ${
                  isRecalled
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={`text-lg font-medium text-center ${
                    isRecalled ? "text-white" : "text-gray-800"
                  }`}
                >
                  {word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}