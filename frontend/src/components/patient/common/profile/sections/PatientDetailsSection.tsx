import React from "react";
import { StyleSheet, View } from "react-native";
import { InfoCard } from "../components/InfoCard";
import { SectionHeader } from "../components/SectionHeader";
import { UserProfile } from "@/src/hooks/usePatientProfile";

interface PatientDetailsSectionProps {
  user: UserProfile;
}

export function PatientDetailsSection({ user }: PatientDetailsSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Patient Details" icon="person-outline" />
      <View style={styles.cardGrid}>
        <InfoCard label="Age" value={String(user.age ?? "Not set")} icon="calendar-outline" />
        <InfoCard label="Gender" value={String(user.gender ?? "Not set")} icon="male-female-outline" />
        <InfoCard label="Caregiver" value="Not assigned yet" icon="heart-outline" />
        <InfoCard label="Emergency Contact" value="Add contact details" icon="call-outline" />
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
});