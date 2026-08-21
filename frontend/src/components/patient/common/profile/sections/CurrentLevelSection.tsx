import { Colors } from "@/src/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";
import { getLevelDescription } from "@/src/hooks/usePatientProfile";

interface CurrentLevelSectionProps {
  patientLevel: string;
}

export function CurrentLevelSection({ patientLevel }: CurrentLevelSectionProps) {
  return (
    <View style={styles.panel}>
      <SectionHeader title="Current Level" icon="trending-up-outline" />
      <View style={styles.levelBox}>
        <Text style={styles.levelLabel}>Current support level</Text>
        <Text style={styles.levelValue}>{patientLevel}</Text>
        <Text style={styles.levelCopy}>{getLevelDescription(patientLevel)}</Text>
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
  levelBox: {
    backgroundColor: Colors.successSoft,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  levelLabel: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "700",
  },
  levelValue: {
    color: "#14532D",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
  },
  levelCopy: {
    color: "#166534",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});