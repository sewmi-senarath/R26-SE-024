import { BRAIN_AREA_BY_SECTION } from "@/src/constants/brainAreas";
import { Difficulty, GameId, SectionName } from "@/src/types/games.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DifficultyBadge } from "./DifficultyBadge";

export interface AccordionGameRow {
  gameId: GameId;
  title: string;
  icon: string;
  tileColor: string;
  difficulty: Difficulty;
}

interface Props {
  section: SectionName;
  games: AccordionGameRow[];
  expanded: boolean;
  onToggle: () => void;
  onPlayGame: (gameId: GameId, difficulty: Difficulty) => void;
}

// One full-width dropdown for a single brain area. Collapsed it shows the
// area name, brain region and game count; expanded it lists every game that
// targets that area, each row navigating straight into the game.
export function BrainAreaAccordion({
  section,
  games,
  expanded,
  onToggle,
  onPlayGame,
}: Props) {
  const area = BRAIN_AREA_BY_SECTION[section];

  return (
    <View className="mx-5 mb-3 rounded-3xl bg-white overflow-hidden border border-gray-100">
      {/* Header */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${section} games, ${games.length} game${games.length === 1 ? "" : "s"}`}
        className="flex-row items-center px-4 py-4"
      >
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: area.color + "22" }}
        >
          <View
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: area.color }}
          />
        </View>

        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-gray-900">{section}</Text>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {area.area}
          </Text>
        </View>

        <View className="bg-gray-100 rounded-full px-2.5 py-1 mr-2">
          <Text className="text-xs font-semibold text-gray-600">
            {games.length} game{games.length === 1 ? "" : "s"}
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9ca3af"
        />
      </TouchableOpacity>

      {/* Body */}
      {expanded ? (
        <View className="px-3 pb-3">
          {games.length === 0 ? (
            <Text className="text-sm text-gray-400 px-2 py-3">
              No games in this area yet.
            </Text>
          ) : (
            games.map((game, index) => (
              <Animated.View
                key={game.gameId}
                entering={FadeInDown.delay(index * 45).duration(260)}
              >
                <TouchableOpacity
                  onPress={() => onPlayGame(game.gameId, game.difficulty)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${game.title}, ${game.difficulty} difficulty`}
                  className="flex-row items-center rounded-2xl px-3 py-3 mb-1.5 bg-gray-50"
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: game.tileColor }}
                  >
                    <Text style={{ fontSize: 22 }}>{game.icon}</Text>
                  </View>

                  <Text
                    className="flex-1 text-base font-semibold text-gray-900 pr-2"
                    numberOfLines={1}
                  >
                    {game.title}
                  </Text>

                  <DifficultyBadge difficulty={game.difficulty} size="sm" />

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#cbd5e1"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
