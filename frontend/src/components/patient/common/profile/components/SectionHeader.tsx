import { Colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={20} color={Colors.primaryDark} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    marginRight: 8,
    width: 36,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
});