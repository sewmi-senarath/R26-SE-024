import { Colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface InfoCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function InfoCard({ label, value, icon }: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.cardValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 140,
    padding: 16,
  },
  smallLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  cardValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
});