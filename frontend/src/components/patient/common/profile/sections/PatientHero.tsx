import { Colors } from "@/src/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { UserProfile } from "@/src/hooks/usePatientProfile";
import { getInitials } from "@/src/utils/formatters";

interface PatientHeroProps {
  user: UserProfile;
}

export function PatientHero({ user }: PatientHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
      </View>
      <View style={styles.heroText}>
        <Text style={styles.eyebrow}>Patient Profile</Text>
        <Text style={styles.heroName} numberOfLines={2}>
          {user.fullName || "Patient"}
        </Text>
        <Text style={styles.heroEmail} numberOfLines={1}>
          {user.email || "Not available"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: Colors.primaryDark,
    borderRadius: 24,
    flexDirection: "row",
    marginBottom: 20,
    padding: 24,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    borderWidth: 1,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: "800",
  },
  heroText: {
    flex: 1,
    marginLeft: 16,
  },
  eyebrow: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroName: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  heroEmail: {
    color: "#DBEAFE",
    fontSize: 14,
    marginTop: 6,
  },
});