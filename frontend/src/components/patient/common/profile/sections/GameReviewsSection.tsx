import { Colors } from "@/src/constants/colors";
import { GAME_CONFIGS } from "@/src/constants/games";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";
import { fallbackReviews } from "@/src/constants/profileConstants";

export function GameReviewsSection() {
  return (
    <View style={styles.panel}>
      <SectionHeader title="Game Reviews" icon="star-outline" />
      <View style={styles.reviewList}>
        {fallbackReviews.map((item) => {
          const game = GAME_CONFIGS[item.gameId];
          return (
            <View key={item.gameId} style={styles.reviewCard}>
              <View style={styles.gameIcon}>
                <Text style={styles.gameEmoji}>{game.icon}</Text>
              </View>
              <View style={styles.reviewBody}>
                <View style={styles.reviewTitleRow}>
                  <Text style={styles.reviewTitle} numberOfLines={1}>
                    {game.title}
                  </Text>
                  <Text style={styles.reviewScore}>{item.bestScore}</Text>
                </View>
                <Text style={styles.reviewMeta}>
                  {item.sessions} plays - Last played {item.lastPlayed}
                </Text>
                <Text style={styles.reviewText}>{item.review}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    flexDirection: "row",
    padding: 16,
  },
  gameIcon: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    marginRight: 12,
    width: 44,
  },
  gameEmoji: {
    fontSize: 22,
  },
  reviewBody: {
    flex: 1,
  },
  reviewTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  reviewScore: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },
  reviewMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});