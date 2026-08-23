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
import { CurrentLevelSection } from "./sections/CurrentLevelSection";
import { GameReviewsSection } from "./sections/GameReviewsSection";
import { PatientDetailsSection } from "./sections/PatientDetailsSection";
import { PatientHero } from "./sections/PatientHero";
import { ScreeningSection } from "./sections/ScreeningSection";
import { SettingsSection } from "./sections/SettingsSection";
import { StatisticsSection } from "./sections/StatisticsSection";

type ProfileTab = "overview" | "reporting";

export default function PatientProfileScreen() {
  const {
    user,
    latestSession,
    loadingScreening,
    patientLevel,
    screeningRows,
    appStats,
    gameReviews,
  } = usePatientProfile();
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
          <PatientHero user={user} />
          <PatientDetailsSection user={user} />
          <ScreeningSection
            latestSession={latestSession}
            loadingScreening={loadingScreening}
            screeningRows={screeningRows}
          />
          <CurrentLevelSection patientLevel={patientLevel} />
          <StatisticsSection stats={appStats} />
          <GameReviewsSection reviews={gameReviews} />
          <SettingsSection settings={settings} onToggleSetting={toggleSetting} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <PatientReportView />
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
