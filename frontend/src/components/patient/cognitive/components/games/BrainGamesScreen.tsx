import {
  GameSessionHistoryItem,
  getPatientGameProgress,
  getPatientGameSessions,
} from "@/src/api/gameSessionApi";
import { GAME_CONFIGS, GAME_ORDER } from "@/src/constants/games";
import { useAssessment } from "@/src/context/AssessmentContext";
import { GameDifficultyAssignment, GameId, PatientGameProgress } from "@/src/types/games.types";
import { generateGamePlan } from "@/src/utils/difficultyEngine";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { DifficultyBadge } from "./DifficultyBadge";
import { DonutChart, TrendBarChart, TrendPoint } from "./shared/ProgressCharts";
import { RadarChart, RadarPoint } from "./shared/RadarChart";

const GAME_SHORT_LABELS: Record<GameId, string> = {
  memory_recall: "Memory",
  object_recall: "Objects",
  attention_game: "Attention",
  photo_puzzle: "Puzzle",
  word_puzzle: "Words",
  orientation_game: "Orientation",
  face_name_match: "Faces",
};

export default function BrainGamesScreen() {
  const router = useRouter();
  const {
    session,
    isLoadingSession,
    hasCompletedAssessment,
    error,
    refreshSession,
    patientId,
  } = useAssessment();
  const gamePlan = useMemo(() => generateGamePlan(session), [session]);

  const [history, setHistory] = useState<GameSessionHistoryItem[]>([]);
  const [adaptiveProgress, setAdaptiveProgress] = useState<PatientGameProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!patientId) return;
      getPatientGameSessions(patientId)
        .then((sessions) => {
          if (!cancelled) setHistory(sessions);
        })
        .catch(() => {
          if (!cancelled) setHistory([]);
        });
      getPatientGameProgress(patientId)
        .then((progress) => {
          if (!cancelled) setAdaptiveProgress(progress);
        })
        .catch(() => {
          if (!cancelled) setAdaptiveProgress([]);
        });
      return () => {
        cancelled = true;
      };
    }, [patientId]),
  );

  // Once a game has been played at least once, its difficulty is driven by
  // the patient's actual performance (accuracy + speed) rather than the
  // one-time assessment score — the assessment plan is just the starting point.
  const assignments: GameDifficultyAssignment[] = useMemo(() => {
    const progressByGame = new Map(adaptiveProgress.map((p) => [p.gameId, p]));
    return gamePlan.assignments.map((assignment) => {
      const adaptive = progressByGame.get(assignment.gameId);
      if (!adaptive || adaptive.totalSessions === 0) return assignment;

      return {
        ...assignment,
        difficulty: adaptive.difficulty,
        reason:
          adaptive.lastChangeReason ??
          `Adapted from your last ${adaptive.totalSessions} session${adaptive.totalSessions === 1 ? "" : "s"}`,
      };
    });
  }, [gamePlan, adaptiveProgress]);

  const trendData: TrendPoint[] = useMemo(() => {
    const sorted = [...history]
      .filter((s) => typeof s.completedAt === "string")
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-6);

    return sorted.map((s, i) => ({
      label: `#${i + 1}`,
      percent: s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
    }));
  }, [history]);

  const radarData: RadarPoint[] = useMemo(() => {
    return GAME_ORDER.map((gameId) => {
      const sessions = history.filter((s) => s.gameId === gameId && s.maxScore > 0);
      const avgPercent = sessions.length
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / sessions.length,
          )
        : 0;
      return { label: GAME_SHORT_LABELS[gameId], value: avgPercent };
    });
  }, [history]);

  // --- Sound effect setup ---
  const soundRef = useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    // Load sound on mount
    (async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/audio/click.wav"),
      );
      soundRef.current = sound;
    })();

    // Unload sound on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSession();
    }, [refreshSession]),
  );

  const playSound = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch {
      // ignore sound errors
    }
  };
  // --- end sound effect setup ---

  const easyCount = assignments.filter(
    (assignment) => assignment.difficulty === "easy",
  ).length;
  const mediumCount = assignments.filter(
    (assignment) => assignment.difficulty === "medium",
  ).length;
  const hardCount = assignments.filter(
    (assignment) => assignment.difficulty === "hard",
  ).length;

  if (isLoadingSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f9fafb",
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-2xl bg-blue-100 items-center justify-center mb-5">
            <Ionicons name="clipboard-outline" size={30} color="#3b82f6" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 text-center">
            Checking your screening status...
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            We are loading your latest assessment result.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!hasCompletedAssessment) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.assessmentPrompt}>
            <View style={styles.promptIcon}>
              <Ionicons name="clipboard-outline" size={32} color="#3b82f6" />
            </View>

            <Text style={styles.promptEyebrow}>
              Screening Required
            </Text>
            <Text style={styles.promptTitle}>
              Complete the assessment first
            </Text>
            <Text style={styles.promptBody}>
              Your games are personalized from your screening test results. Take
              the assessment once, then your game plan will appear here.
            </Text>

            {error ? (
              <Text style={styles.promptError}>{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={() => router.push("/patient/cognitive/assessment")}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go to assessment"
              style={styles.assessmentButton}
            >
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.assessmentButtonText}>
                Go to Assessment
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f9fafb",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 112 }}
        >
          <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-6 pb-2">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Your Personalized
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              Game Plan
            </Text>
          </Animated.View>

          {trendData.length > 0 ? (
            <Animated.View
              entering={FadeInUp.delay(80).duration(450)}
              className="mx-6 mt-2 mb-1 rounded-3xl border border-gray-100 bg-white p-5"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-gray-900">
                  Your Progress
                </Text>
                <Text className="text-xs text-gray-400">
                  Last {trendData.length} sessions
                </Text>
              </View>
              <View className="flex-row items-center gap-4">
                <DonutChart
                  segments={[
                    { value: easyCount, color: "#22c55e", label: "Easy" },
                    { value: mediumCount, color: "#f59e0b", label: "Medium" },
                    { value: hardCount, color: "#ef4444", label: "Hard" },
                  ]}
                  size={80}
                  strokeWidth={12}
                />
                <View style={{ flex: 1 }}>
                  <TrendBarChart data={trendData} height={64} />
                </View>
              </View>
            </Animated.View>
          ) : null}

          {history.length > 0 ? (
            <Animated.View
              entering={FadeInUp.delay(140).duration(450)}
              className="mx-6 mt-2 mb-1 rounded-3xl border border-gray-100 bg-white p-5 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between w-full mb-1">
                <Text className="text-sm font-bold text-gray-900">
                  Cognitive Profile
                </Text>
                <Text className="text-xs text-gray-400">
                  Avg. accuracy by game
                </Text>
              </View>
              <RadarChart data={radarData} size={220} color="#6366f1" />
            </Animated.View>
          ) : null}

          <View className="flex-row gap-2 px-6 py-4">
            {easyCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-green-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <Text className="text-xs font-semibold text-green-700">
                  {easyCount} Easy
                </Text>
              </View>
            ) : null}
            {mediumCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-amber-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
                <Text className="text-xs font-semibold text-amber-700">
                  {mediumCount} Medium
                </Text>
              </View>
            ) : null}
            {hardCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-red-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-red-500" />
                <Text className="text-xs font-semibold text-red-700">
                  {hardCount} Hard
                </Text>
              </View>
            ) : null}
          </View>

          <View className="px-6 gap-3">
            {assignments.map((assignment, index) => {
              const config = GAME_CONFIGS[assignment.gameId];
              const colors = config.color;

              return (
                <Animated.View
                  key={assignment.gameId}
                  entering={FadeInUp.delay(160 + index * 90).duration(450).springify().damping(16)}
                >
                <TouchableOpacity
                  onPress={async () => {
                    await playSound();
                    router.push({
                      pathname: `/patient/cognitive/games/${assignment.gameId}/play`,
                      params: { difficulty: assignment.difficulty },
                    });
                  }}
                  activeOpacity={0.7}
                  className={`rounded-3xl border p-5 ${colors.bg} ${colors.border}`}
                >
                  <View className="flex-row items-start gap-4">
                    <View
                      className={`w-14 h-14 rounded-2xl items-center justify-center ${colors.icon}`}
                    >
                      <Text style={{ fontSize: 28 }}>{config.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-base font-bold text-gray-900">
                          {config.title}
                        </Text>
                        <DifficultyBadge
                          difficulty={assignment.difficulty}
                          size="sm"
                        />
                      </View>
                      <Text
                        className="text-sm text-gray-500 mb-3"
                        numberOfLines={2}
                      >
                        {config.description}
                      </Text>
                      <View className="h-1.5 bg-white rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full ${
                            assignment.difficulty === "easy"
                              ? "bg-green-400"
                              : assignment.difficulty === "medium"
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                          style={{ width: `${assignment.scorePercent}%` }}
                        />
                      </View>
                      {isLoadingSession ? (
                        <Text className="text-xs text-gray-400 mt-2">
                          Loading latest screening result...
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/60">
                    <Text
                      className="text-xs text-gray-400 flex-1 mr-3"
                      numberOfLines={2}
                    >
                      {assignment.reason}
                    </Text>
                    <View className="bg-white rounded-xl px-4 py-2">
                      <Text className="text-sm font-semibold text-gray-700">
                        Play
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  assessmentPrompt: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 96,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  promptIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  promptEyebrow: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  promptTitle: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 12,
  },
  promptBody: {
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  promptError: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 16,
  },
  assessmentButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
  },
  assessmentButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
});
