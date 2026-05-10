import { Colors } from "@/src/constants/colors";
import { MMSESession } from "@/src/types/assessment.types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";
import { ScreeningRow } from "@/src/hooks/usePatientProfile";
import { formatDate } from "@/src/utils/formatters";

interface ScreeningSectionProps {
  latestSession: MMSESession | null;
  loadingScreening: boolean;
  screeningRows: ScreeningRow[];
}

export function ScreeningSection({
  latestSession,
  loadingScreening,
  screeningRows,
}: ScreeningSectionProps) {
  return (
    <View style={styles.panel}>
      <SectionHeader title="Screening Test" icon="clipboard-outline" />
      <View style={styles.scoreRow}>
        <View style={styles.scoreText}>
          <Text style={styles.smallLabel}>Latest MMSE Score</Text>
          <Text style={styles.largeValue}>
            {loadingScreening ? "--" : latestSession ? `${latestSession.totalScore}/30` : "No result"}
          </Text>
        </View>
        <View style={styles.datePill}>
          <Text style={styles.dateLabel}>Completed</Text>
          <Text style={styles.dateValue}>{formatDate(latestSession?.completedAt)}</Text>
        </View>
      </View>

      {screeningRows.length ? (
        <View style={styles.progressList}>
          {screeningRows.map((row) => (
            <View key={row.section} style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{row.section}</Text>
                <Text style={styles.progressValue}>
                  {row.score}/{row.max}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${row.percent}%` }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.mutedText}>
          Screening details will appear here after the first completed test.
        </Text>
      )}
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
  scoreRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scoreText: {
    flex: 1,
    marginRight: 12,
  },
  smallLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  largeValue: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 6,
  },
  datePill: {
    alignItems: "flex-end",
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    maxWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateLabel: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  dateValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "right",
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    width: "100%",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  progressValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  progressTrack: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  mutedText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});