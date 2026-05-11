import { Colors } from "@/src/constants/colors";
import { ProfileStat } from "@/src/hooks/usePatientProfile";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";

type StatisticsSectionProps = {
  stats: ProfileStat[];
};

export function StatisticsSection({ stats }: StatisticsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Statistics" icon="stats-chart-outline" />
      <View style={styles.cardGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.tone}18` }]}>
              <Ionicons
                name={stat.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={stat.tone}
              />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.smallLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 140,
    padding: 16,
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 12,
  },
  smallLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
});
