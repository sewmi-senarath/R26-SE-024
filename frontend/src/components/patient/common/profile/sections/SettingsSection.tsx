import { Colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";

interface SettingsSectionProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function SettingsSection({ soundEnabled, onToggleSound }: SettingsSectionProps) {
  return (
    <View style={styles.panel}>
      <SectionHeader title="Settings" icon="settings-outline" />
      <View style={styles.settingsList}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="volume-high-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Sound Effects</Text>
            <Text style={styles.settingDescription}>Turn game and button sounds on or off.</Text>
          </View>
          <Switch
            accessibilityLabel="Sound effects"
            accessibilityRole="switch"
            value={soundEnabled}
            onValueChange={onToggleSound}
            trackColor={{ false: "#CBD5E1", true: "#BFDBFE" }}
            thumbColor={soundEnabled ? Colors.primary : "#F8FAFC"}
          />
        </View>
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
  settingsList: {
    gap: 10,
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    flexDirection: "row",
    padding: 14,
  },
  settingIcon: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    marginRight: 12,
    width: 40,
  },
  settingText: {
    flex: 1,
    marginRight: 8,
  },
  settingTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  settingDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
