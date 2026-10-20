import {
  CARD_SHADOW,
  InfoCard,
} from "@/src/components/patient/cognitive/components/screening-test/assessmentUi";
import { ProgressBar } from "@/src/components/patient/cognitive/components/screening-test/progressBar";
import { renderQuestion } from "@/src/components/patient/cognitive/components/screening-test/renderers/renderQuestion";
import { getAssessmentSession } from "@/src/api/assessmentApi";
import { normalizeQuestions } from "@/src/hooks/useAssessmentSession";
import { MMSESession, Question } from "@/src/types/assessment.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const noop = () => {};

function isSkipped(answer: unknown, skipped: string[], id: string) {
  return (
    skipped.includes(id) ||
    (typeof answer === "object" &&
      answer !== null &&
      (answer as { skipped?: boolean }).skipped === true)
  );
}

// Read-only walkthrough of a finished MMSE session: the exact questions that
// session received, each showing the answer that was given. Nothing here
// writes to the session or the cached active session.
export default function ReviewAnswersScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const [session, setSession] = useState<MMSESession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError("No assessment selected.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    getAssessmentSession(sessionId)
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.message ?? "Could not load this assessment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const questions: Question[] = useMemo(
    () => normalizeQuestions(session?.questionSet ?? []),
    [session],
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-base text-gray-500">Loading answers…</Text>
      </SafeAreaView>
    );
  }

  if (error || !session || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-slate-50 px-8">
        <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
        <Text className="text-center text-base text-gray-500">
          {error ??
            "The questions for this assessment were not saved, so the answers can't be shown."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-2 rounded-2xl bg-blue-500 px-6 py-3"
        >
          <Text className="text-base font-semibold text-white">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;
  const answer = session.answers?.[question.id];
  const skipped = isSkipped(answer, session.skipped ?? [], question.id);
  const unanswered = !(question.id in (session.answers ?? {}));
  const logEntry = (session.scoringLog ?? []).find(
    (e) => e.questionId === question.id,
  );
  const earned = logEntry?.earned ?? 0;
  const full = earned >= question.maxScore;
  const partial = earned > 0 && !full;

  const badge = skipped || unanswered
    ? { text: "Skipped", bg: "bg-gray-100", fg: "text-gray-600" }
    : full
      ? { text: "Correct", bg: "bg-emerald-100", fg: "text-emerald-700" }
      : partial
        ? { text: "Partly correct", bg: "bg-amber-100", fg: "text-amber-700" }
        : { text: "Incorrect", bg: "bg-rose-100", fg: "text-rose-700" };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <ProgressBar
        current={index + 1}
        total={questions.length}
        sectionName={question.section}
      />

      <View className="mx-6 mt-2 flex-row items-center gap-2 rounded-2xl bg-indigo-50 px-3 py-2">
        <Ionicons name="eye-outline" size={18} color="#4f46e5" />
        <Text className="flex-1 text-sm font-medium text-indigo-700">
          Review mode - answers are read-only
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${badge.bg}`}>
          <Text className={`text-xs font-bold ${badge.fg}`}>
            {badge.text} · {Number(earned.toFixed(2))}/{question.maxScore}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 pt-3 pb-5">
          <Text
            className="text-[26px] font-bold leading-tight text-gray-900"
            accessibilityRole="header"
          >
            {question.prompt}
          </Text>
        </View>

        {(skipped || unanswered) && (
          <View className="px-6 pb-4">
            <InfoCard icon="play-skip-forward-outline" title="Skipped">
              No answer was given for this question.
            </InfoCard>
          </View>
        )}

        {/* pointerEvents none: nothing below can be tapped, typed or drawn on. */}
        <View pointerEvents="none">
          {renderQuestion({
            question,
            onAnswer: noop,
            secondsLeft: 0,
            answer: skipped ? undefined : answer,
            drawing: session.drawings?.[question.id],
            readOnly: true,
          })}
        </View>
      </ScrollView>

      <View
        className="gap-2 rounded-t-3xl bg-white px-6 pb-4 pt-4"
        style={CARD_SHADOW}
      >
        <View className="flex-row gap-3">
          {!isFirst && (
            <TouchableOpacity
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              accessibilityRole="button"
              accessibilityLabel="Previous question"
              className="w-14 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white"
            >
              <Ionicons name="arrow-back" size={24} color="#4b5563" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() =>
              isLast ? router.back() : setIndex((i) => i + 1)
            }
            accessibilityRole="button"
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4"
          >
            <Text className="text-lg font-bold text-white">
              {isLast ? "Done" : "Next"}
            </Text>
            <Ionicons
              name={isLast ? "checkmark-done" : "arrow-forward"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
