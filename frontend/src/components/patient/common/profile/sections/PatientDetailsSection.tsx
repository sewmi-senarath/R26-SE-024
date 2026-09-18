import { Colors } from "@/src/constants/colors";
import { UserProfile } from "@/src/hooks/usePatientProfile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { SectionHeader } from "../components/SectionHeader";

interface PatientDetailsSectionProps {
  user: UserProfile;
  // True when a caregiver is viewing another patient's profile - hides the
  // edit button (editing that account isn't the caregiver's to do here).
  readOnly?: boolean;
}

export function PatientDetailsSection({ user, readOnly = false }: PatientDetailsSectionProps) {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <SectionHeader title="Patient Details" icon="person-outline" />
        {!readOnly && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => router.push("/patient/profile-edit")}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={16} color={Colors.white} />
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardGrid}>
        <InfoCard label="Age" value={String(user.age ?? "Not set")} icon="calendar-outline" />
        <InfoCard label="Gender" value={String(user.gender ?? "Not set")} icon="male-female-outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
