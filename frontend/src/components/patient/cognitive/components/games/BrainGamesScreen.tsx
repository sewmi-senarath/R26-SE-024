import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { GAME_CONFIGS } from '../../../../../constants/games';
import { useAssessment } from '../../../../../context/AssessmentContext';
import { generateGamePlan } from '../../../../../utils/difficultyEngine';
import { DifficultyBadge } from './DifficultyBadge';

export default function BrainGamesScreen() {
  const router = useRouter();
  const { session } = useAssessment();
  const gamePlan = useMemo(() => generateGamePlan(session), [session]);

  const easyCount = gamePlan.assignments.filter(assignment => assignment.difficulty === 'easy').length;
  const mediumCount = gamePlan.assignments.filter(assignment => assignment.difficulty === 'medium').length;
  const hardCount = gamePlan.assignments.filter(assignment => assignment.difficulty === 'hard').length;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
          <View className="px-6 pt-6 pb-2">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Your Personalized
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-1">Game Plan</Text>
          </View>

          <View className="flex-row gap-2 px-6 py-4">
            {easyCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-green-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <Text className="text-xs font-semibold text-green-700">{easyCount} Easy</Text>
              </View>
            ) : null}
            {mediumCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-amber-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
                <Text className="text-xs font-semibold text-amber-700">{mediumCount} Medium</Text>
              </View>
            ) : null}
            {hardCount > 0 ? (
              <View className="flex-row items-center gap-1.5 bg-red-100 rounded-full px-3 py-1.5">
                <View className="w-2 h-2 rounded-full bg-red-500" />
                <Text className="text-xs font-semibold text-red-700">{hardCount} Hard</Text>
              </View>
            ) : null}
          </View>

          <View className="px-6 gap-3">
            {gamePlan.assignments.map(assignment => {
              const config = GAME_CONFIGS[assignment.gameId];
              const colors = config.color;

              return (
                <TouchableOpacity
                  key={assignment.gameId}
                  onPress={() => router.push(`/patient/cognitive/games/${assignment.gameId}/play`)}
                  activeOpacity={0.7}
                  className={`rounded-3xl border p-5 ${colors.bg} ${colors.border}`}
                >
                  <View className="flex-row items-start gap-4">
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center ${colors.icon}`}>
                      <Text style={{ fontSize: 28 }}>{config.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-base font-bold text-gray-900">{config.title}</Text>
                        <DifficultyBadge difficulty={assignment.difficulty} size="sm" />
                      </View>
                      <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
                        {config.description}
                      </Text>
                      <View className="h-1.5 bg-white rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full ${
                            assignment.difficulty === 'easy'
                              ? 'bg-green-400'
                              : assignment.difficulty === 'medium'
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${assignment.scorePercent}%` }}
                        />
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/60">
                    <Text className="text-xs text-gray-400 flex-1 mr-3" numberOfLines={2}>
                      {assignment.reason}
                    </Text>
                    <View className="bg-white rounded-xl px-4 py-2">
                      <Text className="text-sm font-semibold text-gray-700">Play</Text>
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
