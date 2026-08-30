import { BRAIN_AREA_BY_SECTION } from "@/src/constants/brainAreas";
import { usePatientReport } from "@/src/hooks/usePatientReport";
import { Severity } from "@/src/types/assessment.types";
import { SectionName } from "@/src/types/games.types";
import { generatePatientReportHtml } from "@/src/utils/generatePatientReportHtml";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdaptiveDifficultySection } from "./AdaptiveDifficultySection";
import { AssessmentTrendChart } from "./AssessmentTrendChart";
import { BrainAreaRadar, RadarDatum } from "./BrainAreaRadar";
import { GamePerformanceBreakdown } from "./GamePerformanceBreakdown";
import { ProgressOverTime } from "./ProgressOverTime";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// MMSE-derived status (Assessment.severity) - unrelated to the ML triage model.
const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string }
> = {
  none: { label: "No Impairment", color: "#16A34A", bg: "#F0FDF4" },
  mild: { label: "Mild Impairment", color: "#D97706", bg: "#FFFBEB" },
  moderate: { label: "Moderate Impairment", color: "#EA580C", bg: "#FFF7ED" },
  severe: { label: "Severe Impairment", color: "#DC2626", bg: "#FEF2F2" },
};

const SectionHeading: React.FC<{
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = ({ title, subtitle, icon }) => (
  <View className="flex-row items-center gap-2 mb-3 mt-2">
    <Ionicons name={icon} size={16} color="#3b82f6" />
    <View>
      <Text className="text-sm font-bold text-gray-800">{title}</Text>
      {subtitle ? (
        <Text className="text-[11px] text-gray-400">{subtitle}</Text>
      ) : null}
    </View>
  </View>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = ({ label, value, icon, color }) => (
  <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-3.5 items-start">
    <View
      className="w-8 h-8 rounded-lg items-center justify-center mb-2"
      style={{ backgroundColor: color + "18" }}
    >
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <Text className="text-lg font-extrabold text-gray-900">{value}</Text>
    <Text className="text-[10px] text-gray-400">{label}</Text>
  </View>
);

const TREND_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  improving: {
    label: "Improving",
    icon: "trending-up-outline",
    color: "#16A34A",
  },
  declining: {
    label: "Declining",
    icon: "trending-down-outline",
    color: "#DC2626",
  },
  stable: { label: "Stable", icon: "remove-outline", color: "#64748B" },
  "insufficient-data": {
    label: "Not enough data yet",
    icon: "help-outline",
    color: "#94A3B8",
  },
};

interface PatientReportViewProps {
  patientId?: string;
  patientName?: string;
}

export const PatientReportView: React.FC<PatientReportViewProps> = ({
  patientId,
  patientName,
}) => {
  const {
    loading,
    error,
    patientId: resolvedPatientId,
    assessments,
    triageHistory,
    assessmentStats,
    gameStats,
    progress,
    latestTriagePrediction,
    reload,
  } = usePatientReport(patientId);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html = generatePatientReportHtml({
        patientName,
        assessments,
        assessmentStats,
        gameStats,
        triageHistory,
        progress,
        latestTriagePrediction,
      });
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (Platform.OS === "web") {
        Alert.alert("Report ready", "Your report has been generated.");
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: patientName
            ? `${patientName}'s Cognitive Report`
            : "Cognitive Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Report saved", `PDF saved to:\n${uri}`);
      }
    } catch (e: any) {
      Alert.alert(
        "Couldn't generate report",
        e?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color="#3b82f6" />
        <Text className="text-xs text-gray-400 mt-3">Building report…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-16 px-6">
        <Ionicons name="cloud-offline-outline" size={28} color="#CBD5E1" />
        <Text className="text-sm text-gray-400 text-center mt-3">{error}</Text>
      </View>
    );
  }

  const trend = TREND_META[assessmentStats.trend];

  // Merge assessment-derived and game-derived section performance into one
  // "brain area profile" - averaged when both sources are available so the
  // radar reflects the fullest picture of function in that domain.
  const sections: SectionName[] = [
    "Orientation",
    "Registration",
    "Attention",
    "Recall",
    "Language",
  ];
  const radarData: RadarDatum[] = sections.map((section) => {
    const fromAssessment =
      assessmentStats.sectionAverages[section]?.avgPercent ?? null;
    const gameEntry = gameStats.brainAreaPerformance.find(
      (b) => b.section === section,
    );
    const fromGames = gameEntry?.avgPercent ?? null;
    let percent = 0;
    if (fromAssessment !== null && fromGames !== null)
      percent = Math.round((fromAssessment + fromGames) / 2);
    else if (fromAssessment !== null) percent = fromAssessment;
    else if (fromGames !== null) percent = fromGames;
    return { section, percent };
  });

  const latestSeverity = assessmentStats.latestSeverity ?? null;
  const severityMeta = latestSeverity ? SEVERITY_META[latestSeverity] : null;
  const triageMeta = latestTriagePrediction
    ? latestTriagePrediction.triage === "escalate"
      ? { label: "Clinical review recommended", color: "#DC2626", bg: "#FEF2F2" }
      : { label: "Keep monitoring", color: "#16A34A", bg: "#F0FDF4" }
    : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#3b82f6"
        />
      }
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {patientName && (
        <Text className="text-xs text-gray-400 mb-3">
          Cognitive report for{" "}
          <Text className="font-semibold text-gray-600">{patientName}</Text>
        </Text>
      )}

      {/* ── Report actions ──────────────────────────────────────────── */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 py-3 rounded-2xl"
          style={{ backgroundColor: "#3B82F6", opacity: downloading ? 0.7 : 1 }}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={16} color="#fff" />
          )}
          <Text className="text-xs font-bold text-white">
            {downloading ? "Preparing…" : "Download Report"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Quick stats row ─────────────────────────────────────────── */}
      <View className="flex-row gap-2.5 mb-2">
        <StatCard
          label="Assessments"
          value={String(assessmentStats.count)}
          icon="clipboard-outline"
          color="#3B82F6"
        />
        <StatCard
          label="Games Played"
          value={String(gameStats.totalPlays)}
          icon="game-controller-outline"
          color="#8B5CF6"
        />
      </View>

      {/* ── Current status banner ───────────────────────────────────── */}
      {severityMeta && (
        <View
          className="rounded-2xl p-4 mb-2 flex-row items-center gap-3"
          style={{ backgroundColor: severityMeta.bg }}
        >
          <View className="flex-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: severityMeta.color }}
            >
              Current Cognitive Status
            </Text>
            <Text className="text-base font-extrabold text-gray-900">
              {severityMeta.label}
            </Text>
            {assessmentStats.latestScore !== null && (
              <Text className="text-xs text-gray-500 mt-0.5">
                Latest MMSE score: {assessmentStats.latestScore}/30
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/70">
            <Ionicons name={trend.icon} size={13} color={trend.color} />
            <Text
              className="text-[11px] font-semibold"
              style={{ color: trend.color }}
            >
              {trend.label}
            </Text>
          </View>
        </View>
      )}

      {/* ── AI triage (ML model) ────────────────────────────────────── */}
      {triageMeta && latestTriagePrediction && (
        <View
          className="rounded-2xl p-4 mb-2 flex-row items-center gap-3"
          style={{ backgroundColor: triageMeta.bg }}
        >
          <View className="flex-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: triageMeta.color }}
            >
              AI Triage
            </Text>
            <Text className="text-base font-extrabold text-gray-900">
              {triageMeta.label}
            </Text>
          </View>
          <View className="px-2.5 py-1.5 rounded-xl bg-white/70">
            <Text
              className="text-[11px] font-semibold"
              style={{ color: triageMeta.color }}
            >
              {Math.round(latestTriagePrediction.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      )}

      {/* ── Initial screening & progress ────────────────────────────── */}
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 mt-2">
        <SectionHeading
          title="Initial Screening & Progress"
          subtitle="Baseline (first assessment) vs. where things stand now"
          icon="flag-outline"
        />
        <ProgressOverTime progress={progress} />
      </View>

      {/* ── Assessment trend ────────────────────────────────────────── */}
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <SectionHeading
          title="Assessment Score Over Time"
          subtitle="MMSE total score (0-30) per completed assessment"
          icon="stats-chart-outline"
        />
        <AssessmentTrendChart
          assessments={assessments}
          width={SCREEN_WIDTH - 24 * 2 - 32}
        />
        {assessmentStats.count > 0 && (
          <View className="flex-row justify-between mt-2 pt-3 border-t border-gray-50">
            <Text className="text-xs text-gray-500">Average score</Text>
            <Text className="text-xs font-bold text-gray-700">
              {assessmentStats.averageScore}/30
            </Text>
          </View>
        )}
      </View>

      {/* ── Brain area profile ──────────────────────────────────────── */}
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <SectionHeading
          title="Brain Area Performance"
          subtitle="Combines assessment sections + matching brain games"
          icon="analytics-outline"
        />
        <BrainAreaRadar
          data={radarData}
          size={Math.min(SCREEN_WIDTH - 80, 280)}
        />
        <View className="mt-3 gap-1.5">
          {sections.map((s) => {
            const info = BRAIN_AREA_BY_SECTION[s];
            return (
              <View key={s} className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <Text className="text-[11px] text-gray-500 flex-1">
                  <Text className="font-semibold text-gray-700">{s}</Text> -{" "}
                  {info.shortArea}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Game performance breakdown ──────────────────────────────── */}
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <SectionHeading
          title="Brain Games Breakdown"
          subtitle="Per-game performance and target brain area"
          icon="game-controller-outline"
        />
        <GamePerformanceBreakdown perGame={gameStats.perGame} />
      </View>

      {/* ── Adaptive difficulty ─────────────────────────────────────── */}
      <AdaptiveDifficultySection patientId={resolvedPatientId} />

      {/* ── Methodology footnote ────────────────────────────────────── */}
      <Text className="text-[10px] text-gray-300 text-center px-6 leading-4">
        Brain area associations reflect standard MMSE domain groupings and are
        provided for general context, not a clinical diagnosis. Severity/risk
        figures come from MemoCare's ML models - see the assessment and
        screening screens for full details.
      </Text>
    </ScrollView>
  );
};
