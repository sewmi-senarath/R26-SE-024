import { getPatientAssessmentHistory } from "@/src/api/assessmentApi";
import { getMe } from "@/src/api/authApi";
import { GAME_CONFIGS } from "@/src/constants/games";
import { loadActiveSession } from "@/src/utils/sessionStorage";
import { generateGamePlan, SessionScores } from "@/src/utils/difficultyEngine";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DifficultyBadge } from "./DifficultyBadge";

const FALLBACK_SESSION: SessionScores = {
  sessionId: "no-completed-assessment",
  totalScore: 0,
  sectionScores: {
    Orientation: 0,
    Registration: 0,
    Attention: 0,
    Recall: 0,
    Language: 0,
  },
};

export default function BrainGamesScreen() {
  const router = useRouter();
  const [session, setSession] = useState<SessionScores>(FALLBACK_SESSION);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const gamePlan = useMemo(() => generateGamePlan(session), [session]);

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

  useEffect(() => {
    let mounted = true;

    const loadScreeningResult = async () => {
      try {
        const activeSession = await loadActiveSession();
        if (!mounted) return;

        if (activeSession?.status === "done") {
          setSession({
            sessionId: activeSession.sessionId,
            totalScore: activeSession.totalScore,
            sectionScores: activeSession.sectionScores,
          });
          return;
        }

        const meRes = await getMe();
        const patientId =
          meRes?.success && meRes.data.user.role === "patient"
            ? meRes.data.user.id
            : null;
        if (!patientId) return;

        const sessions = await getPatientAssessmentHistory(patientId);
        const latestDone = sessions.find((item) => item.status === "done");
        if (!latestDone || !mounted) return;

        setSession({
          sessionId: latestDone.sessionId,
          totalScore: latestDone.totalScore,
          sectionScores: latestDone.sectionScores,
        });
      } finally {
        if (mounted) setIsLoadingSession(false);
      }
    };

    loadScreeningResult();

    return () => {
      mounted = false;
    };
  }, []);

  const playSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (e) {
      // ignore sound errors
    }
  };
  // --- end sound effect setup ---

  const easyCount = gamePlan.assignments.filter(
    (assignment) => assignment.difficulty === "easy",
  ).length;
  const mediumCount = gamePlan.assignments.filter(
    (assignment) => assignment.difficulty === "medium",
  ).length;
  const hardCount = gamePlan.assignments.filter(
    (assignment) => assignment.difficulty === "hard",
  ).length;

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
          <View className="px-6 pt-6 pb-2">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Your Personalized
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              Game Plan
            </Text>
          </View>

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
            {gamePlan.assignments.map((assignment) => {
              const config = GAME_CONFIGS[assignment.gameId];
              const colors = config.color;

              return (
                <TouchableOpacity
                  key={assignment.gameId}
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
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
