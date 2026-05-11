import React from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { usePatientProfile } from "../../../../hooks/usePatientProfile";
import { useSettings } from "../../../../hooks/useSettings";
import { CurrentLevelSection } from "./sections/CurrentLevelSection";
import { GameReviewsSection } from "./sections/GameReviewsSection";
import { PatientDetailsSection } from "./sections/PatientDetailsSection";
import { PatientHero } from "./sections/PatientHero";
import { ScreeningSection } from "./sections/ScreeningSection";
import { SettingsSection } from "./sections/SettingsSection";
import { StatisticsSection } from "./sections/StatisticsSection";

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

  return (
    <SafeAreaView style={styles.safeArea}>
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
});
