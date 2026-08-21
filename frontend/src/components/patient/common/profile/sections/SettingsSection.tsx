import { Colors } from "@/src/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SectionHeader } from "../components/SectionHeader";
import { settingRows } from "@/src/constants/profileConstants";
import { SettingKey } from "../../../../../hooks/useSettings";

interface SettingsSectionProps {
  settings: Record<SettingKey, boolean>;
  onToggleSetting: (key: SettingKey) => void;
}

export function SettingsSection({ settings, onToggleSetting }: SettingsSectionProps) {
  return (
    <View style={styles.panel}>
      <SectionHeader title="Settings" icon="settings-outline" />
      <View style={styles.settingsList}>
        {settingRows.map((item) => (
          <View key={item.key} style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={() => onToggleSetting(item.key)}
              trackColor={{ false: "#CBD5E1", true: "#BFDBFE" }}
              thumbColor={settings[item.key] ? Colors.primary : "#F8FAFC"}
            />
          </View>
        ))}

        <TouchableOpacity activeOpacity={0.75} style={styles.passwordRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="key-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Change Password</Text>
            <Text style={styles.settingDescription}>
              Update account password and security details.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
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
  passwordRow: {
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
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