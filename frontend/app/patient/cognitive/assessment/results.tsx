import { AIPredictionCard } from "@/src/components/patient/cognitive/components/screening-test/AIPredictionCard";
import { useAssessmentSession } from "@/src/hooks/useAssessmentSession";
import { Question } from "@/src/types/assessment.types";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Section max scores — fixed MMSE values
const SECTION_MAX: Record<string, number> = {
  Orientation: 10,
  Registration: 3,
  Attention: 5,
  Recall: 3,
  Language: 9,
};

const format3 = (value: number) => Number(value).toFixed(3);

// ── Human-readable answer helpers for the "mistakes" breakdown ──────
function describeUserAnswer(q: Question, answer: any): string {
  if (answer == null) return "No answer given";
  if (typeof answer === "object" && (answer as any).skipped) return "Skipped";

  switch (q.type) {
    case "mcq":
    case "image_mcq":
      return String(answer);
    case "serial_subtraction":
      return Array.isArray(answer)
        ? answer.map((x) => (x === "" || x == null ? "—" : x)).join(", ")
        : String(answer);
    case "word_recall_display":
    case "word_recall_input":
      return Array.isArray(answer) && answer.length
        ? answer.join(", ")
        : "No words recalled";
    case "instruction_action":
      return answer === "correct"
        ? "Instruction followed"
        : "Instruction not followed";
    case "phrase_repeat":
      return answer === "correct" ? "Repeated correctly" : "Not repeated correctly";
    case "drawing_canvas":
      return answer === true ? "Drawing accepted" : "Drawing not accepted";
    case "text_input":
      return typeof answer === "string" && answer.trim()
        ? `“${answer.trim()}”`
        : "No answer given";
    default:
      return String(answer);
  }
}

function describeExpected(q: Question): string {
  switch (q.type) {
    case "mcq":
    case "image_mcq":
    case "serial_subtraction":
      return (q.expectedAnswers ?? []).join(", ");
    case "word_recall_display":
    case "word_recall_input":
      return (q.words ?? []).join(", ");
    case "instruction_action":
      return "Instruction performed correctly";
    case "phrase_repeat":
      return "Phrase repeated exactly";
    case "drawing_canvas":
      return "Two overlapping five-sided figures";
    case "text_input":
      return "A complete, sensible sentence";
    default:
      return "";
  }
}

// A short note on how each question type is marked, so the breakdown explains
// why points were awarded or lost.
function markingRule(q: Question): string {
  switch (q.type) {
    case "mcq":
    case "image_mcq":
      return "Full marks only for the correct option.";
    case "serial_subtraction":
      return "1 point per correct subtraction of 7, counted from your previous answer.";
    case "word_recall_display":
    case "word_recall_input":
      return "1 point for each of the three words recalled.";
    case "instruction_action":
      return "Marked correct/incorrect by the caregiver.";
    case "phrase_repeat":
      return "Marked correct/incorrect by the caregiver.";
    case "drawing_canvas":
      return "Marked correct/incorrect by the caregiver.";
    case "text_input":
      return "1 mark for a complete, sensible sentence.";
    default:
      return "";
  }
}

export default function ResultsScreen() {
  const router = useRouter();
  const { session, questions } = useAssessmentSession();

  // ── Move ALL hooks to top — BEFORE any conditional logic ──────
  const animatedScore = useRef(new Animated.Value(0)).current;
  const scoreBarWidth = useRef(new Animated.Value(0)).current;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    // Only animate if session is done
    if (session.status !== "done") return;

    Animated.timing(animatedScore, {
      toValue: session.totalScore,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    Animated.timing(scoreBarWidth, {
      toValue: (session.totalScore / 30) * 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [session.totalScore, session.status, animatedScore, scoreBarWidth]);

  // ── NOW you can do conditional checks ──────────────────────────
  if (session.status !== "done") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">No completed assessment found.</Text>
        <TouchableOpacity
          onPress={() => router.replace("/patient/cognitive/assessment")}
          className="mt-4"
        >
          <Text className="text-blue-500">Start Assessment</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Per-question earned marks (from the backend scoring log), keyed by id.
  const earnedByQuestion: Record<string, number> = {};
  (session.scoringLog ?? []).forEach((entry) => {
    earnedByQuestion[entry.questionId] = entry.earned;
  });

  // Group the assessment questions under their section for the breakdown.
  const questionsBySection: Record<string, Question[]> = {};
  (questions ?? []).forEach((q) => {
    (questionsBySection[q.section] ??= []).push(q);
  });

  // ── Animated score counter ────────────────────────────────────
  // const animatedScoreText = animatedScore.interpolate({
  //   inputRange: [0, 30],
  //   outputRange: ['0', '30'],
  // });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Assessment Complete
          </Text>
          <Text className="text-2xl font-bold text-gray-900">MMSE Results</Text>
          {session.completedAt && (
            <Text className="text-xs text-gray-400 mt-1">
              Completed {new Date(session.completedAt).toLocaleString()}
            </Text>
          )}
        </View>

        {/* ── Total score card ───────────────────────────────── */}
        <View className="mx-6 rounded-3xl border border-gray-100 bg-white p-6 mb-4">
          {/* Score label */}
          <View className="mb-4">
            <Text className="text-xs text-gray-500 uppercase tracking-wide">
              Your MMSE Score
            </Text>
          </View>

          {/* Animated total score */}
          <View className="items-center mb-5">
            <View className="flex-row items-end gap-1">
              <Animated.Text
                style={{
                  fontSize: 64,
                  fontWeight: "800",
                  color: "#111827",
                  lineHeight: 72,
                }}
              >
                {format3(session.totalScore)}
              </Animated.Text>
              <Text className="text-2xl font-semibold text-gray-400 mb-3">
                / {format3(30)}
              </Text>
            </View>
          </View>

          {/* Score progress bar */}
          <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full bg-blue-500"
              style={{
                width: scoreBarWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>

          {/* Scale markers */}
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-xs text-gray-400">0</Text>
            <Text className="text-xs text-gray-400">
              Impairment threshold: 23
            </Text>
            <Text className="text-xs text-gray-400">30</Text>
          </View>
        </View>

        {/* ── Impairment flag banner ─────────────────────────── */}
        {session.impairmentFlag && (
          <View className="mx-6 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-3">
            <Text className="text-red-500 text-lg">⚠</Text>
            <Text className="text-sm text-red-700 flex-1">
              Score is at or below the impairment threshold of 23. Clinical
              review is recommended.
            </Text>
          </View>
        )}

        {/* ── AI severity prediction (ML model) ── */}
        {session.patientId && (
          <AIPredictionCard patientId={session.patientId} />
        )}

        {/* ── Section breakdown ──────────────────────────────── */}
        <View className="mx-6 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Score Breakdown
          </Text>
          <Text className="text-xs text-gray-400 mb-3 -mt-1">
            Tap a section to see mistakes and how they affected the score.
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {Object.entries(session.sectionScores).map(
              ([section, score], index, arr) => {
                const max = SECTION_MAX[section] ?? 0;
                const pct = max > 0 ? (score / max) * 100 : 0;
                const isLast = index === arr.length - 1;
                const isOpen = expandedSection === section;

                const sectionQuestions = questionsBySection[section] ?? [];
                const mistakes = sectionQuestions.filter(
                  (q) => (earnedByQuestion[q.id] ?? 0) < q.maxScore,
                );

                return (
                  <View
                    key={section}
                    className={!isLast ? "border-b border-gray-50" : ""}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setExpandedSection(isOpen ? null : section)
                      }
                      className="px-4 py-4"
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-medium text-gray-800">
                            {section}
                          </Text>
                          {mistakes.length > 0 ? (
                            <View className="bg-red-50 rounded-full px-2 py-0.5">
                              <Text className="text-[11px] font-medium text-red-600">
                                {mistakes.length} issue
                                {mistakes.length > 1 ? "s" : ""}
                              </Text>
                            </View>
                          ) : (
                            <View className="bg-green-50 rounded-full px-2 py-0.5">
                              <Text className="text-[11px] font-medium text-green-600">
                                Full marks
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm font-bold text-gray-900">
                            {format3(score)}
                          </Text>
                          <Text className="text-sm text-gray-400">
                            / {format3(max)}
                          </Text>
                          <Text className="text-gray-400 ml-1 text-xs">
                            {isOpen ? "▲" : "▼"}
                          </Text>
                        </View>
                      </View>

                      {/* Per-section mini bar */}
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* ── Dropdown: mistakes & marking impact ──────── */}
                    {isOpen && (
                      <View className="px-4 pb-4 pt-1 bg-gray-50">
                        {sectionQuestions.length === 0 ? (
                          <Text className="text-xs text-gray-400">
                            No detail available for this section.
                          </Text>
                        ) : mistakes.length === 0 ? (
                          <View className="flex-row items-center gap-2 py-1">
                            <Text className="text-green-600">✓</Text>
                            <Text className="text-xs text-gray-600 flex-1">
                              All questions answered correctly — no marks lost
                              here.
                            </Text>
                          </View>
                        ) : (
                          <View className="gap-3">
                            {mistakes.map((q) => {
                              const earned = earnedByQuestion[q.id] ?? 0;
                              const lost = q.maxScore - earned;
                              const answer = session.answers?.[q.id];
                              return (
                                <View
                                  key={q.id}
                                  className="bg-white rounded-xl border border-gray-100 p-3 gap-1.5"
                                >
                                  <View className="flex-row justify-between items-start gap-2">
                                    <Text className="text-sm font-medium text-gray-800 flex-1">
                                      {q.prompt}
                                    </Text>
                                    <View className="bg-red-50 rounded-lg px-2 py-1">
                                      <Text className="text-[11px] font-semibold text-red-600">
                                        −{lost} pt{lost > 1 ? "s" : ""}
                                      </Text>
                                    </View>
                                  </View>

                                  <View className="flex-row gap-2">
                                    <Text className="text-xs text-gray-400 w-16">
                                      Answered
                                    </Text>
                                    <Text className="text-xs text-gray-700 flex-1">
                                      {describeUserAnswer(q, answer)}
                                    </Text>
                                  </View>

                                  {!!describeExpected(q) && (
                                    <View className="flex-row gap-2">
                                      <Text className="text-xs text-gray-400 w-16">
                                        Expected
                                      </Text>
                                      <Text className="text-xs text-green-700 flex-1">
                                        {describeExpected(q)}
                                      </Text>
                                    </View>
                                  )}

                                  <View className="flex-row gap-2">
                                    <Text className="text-xs text-gray-400 w-16">
                                      Score
                                    </Text>
                                    <Text className="text-xs text-gray-600 flex-1">
                                      {earned} / {q.maxScore} · {markingRule(q)}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* ── Severity scale reference ───────────────────────── */}
        <View className="mx-6 mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            MMSE Severity Scale
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[
              {
                range: "24 - 30",
                label: "No Impairment",
                color: "bg-green-400",
              },
              {
                range: "19 - 23",
                label: "Mild Impairment",
                color: "bg-amber-400",
              },
              {
                range: "10 - 18",
                label: "Moderate Impairment",
                color: "bg-orange-400",
              },
              {
                range: "0 - 9",
                label: "Severe Impairment",
                color: "bg-red-400",
              },
            ].map((band, index, arr) => {
              const isLast = index === arr.length - 1;

              return (
                <View
                  key={band.range}
                  className={`flex-row items-center px-4 py-3 gap-3 ${!isLast ? "border-b border-gray-50" : ""}`}
                >
                  {/* Colour dot */}
                  <View className={`w-2.5 h-2.5 rounded-full ${band.color}`} />

                  <Text className="flex-1 text-sm text-gray-500">
                    {band.label}
                  </Text>

                  <Text className="text-sm text-gray-400">
                    {band.range}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Session metadata ───────────────────────────────── */}
        <View className="mx-6 mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Session Details
          </Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[
              { label: "Patient ID", value: session.patientId },
              { label: "Caregiver ID", value: session.caregiverId },
              {
                label: "Session ID",
                value: session.sessionId.slice(0, 8) + "...",
              },
              {
                label: "Started",
                value: new Date(session.startedAt).toLocaleTimeString(),
              },
              {
                label: "Duration",
                value: session.completedAt
                  ? `${Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} min`
                  : "—",
              },
              { label: "Mode", value: session.administrationMode },
            ].map((row, index, arr) => (
              <View
                key={row.label}
                className={`flex-row justify-between px-4 py-3 ${index !== arr.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                <Text className="text-sm text-gray-500">{row.label}</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Action buttons ─────────────────────────────────── */}
        <View className="mx-6 gap-3">
          {/* go back to patient dashboard */}
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-2xl items-center"
            onPress={() => router.replace("/patient/games")}
          >
            <Text className="text-white font-bold text-xl">
              Return to Activities
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
