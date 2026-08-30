import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { usePatientProfile } from "../../../../hooks/usePatientProfile";
import { useSettings } from "../../../../hooks/useSettings";
import { PatientReportView } from "../../cognitive/components/report/PatientReportView";
import { GameReviewsSection } from "./sections/GameReviewsSection";
import { PatientDetailsSection } from "./sections/PatientDetailsSection";
import { PatientHero } from "./sections/PatientHero";
import { SettingsSection } from "./sections/SettingsSection";
import { SeverityCheckSection } from "./sections/SeverityCheckSection";

type ProfileTab = "overview" | "reporting";

interface PatientProfileScreenProps {
  // When provided (a caregiver viewing a linked patient), loads that
  // patient's data instead of the logged-in user's own. Omit for the
  // patient's own self-view (frontend/app/patient/(tabs)/profile/index.tsx).
  patientId?: string;
  patientName?: string;
  // Hides controls that only make sense on the account's own device
  // (Logout, Update details, personal app Settings).
  isCaregiverView?: boolean;
}

export default function PatientProfileScreen({
  patientId,
  patientName,
  isCaregiverView = false,
}: PatientProfileScreenProps) {
  const { user, gameReviews, latestSession } = usePatientProfile(
    patientId,
    patientName ? { fullName: patientName } : undefined,
  );
  const { settings, toggleSetting } = useSettings();
  const [tab, setTab] = useState<ProfileTab>("overview");

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setTab("overview")}
          style={[styles.tabButton, tab === "overview" && styles.tabButtonActive]}
        >
          <Ionicons name="person-outline" size={15} color={tab === "overview" ? "#fff" : "#64748B"} />
          <Text style={[styles.tabLabel, tab === "overview" && styles.tabLabelActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("reporting")}
          style={[styles.tabButton, tab === "reporting" && styles.tabButtonActive]}
        >
          <Ionicons name="bar-chart-outline" size={15} color={tab === "reporting" ? "#fff" : "#64748B"} />
          <Text style={[styles.tabLabel, tab === "reporting" && styles.tabLabelActive]}>Reporting</Text>
        </TouchableOpacity>
      </View>

      {tab === "overview" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PatientHero user={user} readOnly={isCaregiverView} />
          <PatientDetailsSection user={user} readOnly={isCaregiverView} />
          <SeverityCheckSection
            patientId={user.id ?? ""}
            latestSession={latestSession}
            showTakeAssessmentCta={!isCaregiverView}
          />
          <GameReviewsSection reviews={gameReviews} />
          {!isCaregiverView && (
            <SettingsSection settings={settings} onToggleSetting={toggleSetting} />
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <PatientReportView patientId={patientId} patientName={patientName} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 112,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: "#EEF2F7",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#3B82F6",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabLabelActive: {
    color: "#fff",
  },
});
