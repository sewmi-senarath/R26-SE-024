import { getPatientGameProgress } from "@/src/api/gameSessionApi";
import { DOMAIN_GAME_POOLS, DOMAIN_ORDER, GAME_CONFIGS } from "@/src/constants/games";
import { useAssessment } from "@/src/context/AssessmentContext";
import { GameDifficultyAssignment, PatientGameProgress, SectionName } from "@/src/types/games.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Per-domain active-game index (which game in each brain area's pool is shown).
type DomainSlots = Record<SectionName, number>;

const buildDefaultSlots = (): DomainSlots =>
  DOMAIN_ORDER.reduce((slots, domain) => {
    slots[domain] = 0;
    return slots;
  }, {} as DomainSlots);

const slotsStorageKey = (patientId: string) =>
  `@memocare/game_slots/${patientId}`;

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

  const [adaptiveProgress, setAdaptiveProgress] = useState<PatientGameProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!patientId) return;
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
  // one-time assessment score - the assessment plan is just the starting point.
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

  // ── One active game per brain area (5 visible at once) ──────────────────
  const [slots, setSlots] = useState<DomainSlots>(buildDefaultSlots);

  // Load the patient's saved selection so refreshes persist across visits.
  React.useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    AsyncStorage.getItem(slotsStorageKey(patientId))
      .then((raw) => {
        if (cancelled || !raw) return;
        const saved = JSON.parse(raw) as Partial<DomainSlots>;
        setSlots({ ...buildDefaultSlots(), ...saved });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const assignmentByGame = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.gameId, assignment])),
    [assignments],
  );

  // Exactly one assignment per brain area, chosen by that area's slot index.
  const activeAssignments: GameDifficultyAssignment[] = useMemo(() => {
    return DOMAIN_ORDER.map((domain) => {
      const pool = DOMAIN_GAME_POOLS[domain];
      if (pool.length === 0) return null;
      const gameId = pool[(slots[domain] ?? 0) % pool.length];
      return assignmentByGame.get(gameId) ?? null;
    }).filter((a): a is GameDifficultyAssignment => a !== null);
  }, [slots, assignmentByGame]);

  // Rotate to the next game within the same brain area, then persist.
  const handleRefreshDomain = useCallback(
    (domain: SectionName) => {
      const pool = DOMAIN_GAME_POOLS[domain];
      if (pool.length <= 1) return; // no alternative to swap to
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSlots((prev) => {
        const next = { ...prev, [domain]: ((prev[domain] ?? 0) + 1) % pool.length };
        if (patientId) {
          AsyncStorage.setItem(
            slotsStorageKey(patientId),
            JSON.stringify(next),
          ).catch(() => {});
        }
        return next;
      });
    },
    [patientId],
  );

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

  const easyCount = activeAssignments.filter(
    (assignment) => assignment.difficulty === "easy",
  ).length;
  const mediumCount = activeAssignments.filter(
    (assignment) => assignment.difficulty === "medium",
  ).length;
  const hardCount = activeAssignments.filter(
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

          <View className="flex-row flex-wrap justify-between px-5">
            {activeAssignments.map((assignment, index) => {
              const config = GAME_CONFIGS[assignment.gameId];
              const domain = assignment.sectionName as SectionName;
              const canRefresh = (DOMAIN_GAME_POOLS[domain]?.length ?? 0) > 1;

              return (
                <Animated.View
                  key={assignment.gameId}
                  entering={FadeInUp.delay(120 + index * 70)
                    .duration(450)
                    
                    }
                  style={{ width: "48%", marginBottom: 14 }}
                >
                  <TouchableOpacity
                    onPress={async () => {
                      await playSound();
                      router.push({
                        pathname: `/patient/cognitive/games/${assignment.gameId}/play`,
                        params: { difficulty: assignment.difficulty },
                      });
                    }}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${config.title}, ${assignment.difficulty} difficulty`}
                    style={{
                      aspectRatio: 1,
                      borderRadius: 28,
                      backgroundColor: config.color.tile,
                      padding: 16,
                      overflow: "hidden",
                      shadowColor: config.color.tileDark,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 5,
                    }}
                  >
                    {/* decorative depth accents */}
                    <View
                      style={{
                        position: "absolute",
                        top: -34,
                        right: -30,
                        width: 110,
                        height: 110,
                        borderRadius: 55,
                        backgroundColor: config.color.tileDark,
                        opacity: 0.55,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: -46,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: "#ffffff",
                        opacity: 0.08,
                      }}
                    />

                    {/* Refresh: swap this brain area for another game in it */}
                    {canRefresh ? (
                      <TouchableOpacity
                        onPress={() => handleRefreshDomain(domain)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Change this ${domain} game`}
                        style={{
                          position: "absolute",
                          bottom: 14,
                          right: 14,
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: "rgba(255,255,255,0.25)",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 10,
                        }}
                      >
                        <Ionicons name="refresh" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    ) : null}

                    <View className="flex-1 justify-between">
                      <View className="flex-row items-start justify-between">
                        <View
                          className="items-center justify-center"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 18,
                            backgroundColor: "rgba(255,255,255,0.25)",
                          }}
                        >
                          <Text style={{ fontSize: 30 }}>{config.icon}</Text>
                        </View>
                        <DifficultyBadge
                          difficulty={assignment.difficulty}
                          size="sm"
                        />
                      </View>

                      <View>
                        <Text
                          className="font-extrabold text-white"
                          style={{ fontSize: 18, lineHeight: 22 }}
                          numberOfLines={2}
                        >
                          {config.title}
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                          <Text
                            className="font-semibold text-white"
                            style={{ fontSize: 12, opacity: 0.9 }}
                          >
                            Play
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color="#ffffff"
                            style={{ marginLeft: 4, opacity: 0.9 }}
                          />
                        </View>
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
