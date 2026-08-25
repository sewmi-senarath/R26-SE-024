import { BRAIN_AREA_BY_SECTION } from "@/src/constants/brainAreas";
import { PatientProgress, ProgressDirection } from "@/src/hooks/usePatientReport";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

const DIRECTION_META: Record<
  ProgressDirection,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  improved: { label: "Improving", icon: "trending-up", color: "#16A34A", bg: "#F0FDF4" },
  declined: { label: "Declining", icon: "trending-down", color: "#DC2626", bg: "#FEF2F2" },
  steady: { label: "Holding Steady", icon: "remove", color: "#64748B", bg: "#F8FAFC" },
  "insufficient-data": { label: "Baseline Set", icon: "flag", color: "#3B82F6", bg: "#EFF6FF" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Small +/- pill used for a signed percentage-point delta. */
const DeltaPill: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "pts" }) => {
  const up = value > 0;
  const flat = value === 0;
  const color = flat ? "#64748B" : up ? "#16A34A" : "#DC2626";
  const bg = flat ? "#F1F5F9" : up ? "#DCFCE7" : "#FEE2E2";
  return (
    <View className="flex-row items-center gap-0.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: bg }}>
      <Ionicons name={flat ? "remove" : up ? "arrow-up" : "arrow-down"} size={10} color={color} />
      <Text className="text-[10px] font-bold" style={{ color }}>
        {up ? "+" : ""}
        {value} {suffix}
      </Text>
    </View>
  );
};

/** Baseline vs latest, overlaid on one track so the movement is obvious. */
const SectionDeltaBar: React.FC<{
  section: string;
  baseline: number;
  latest: number;
  delta: number;
  color: string;
}> = ({ section, baseline, latest, delta, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: latest, duration: 700, useNativeDriver: false }).start();
  }, [latest]);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[12px] font-semibold text-gray-700">{section}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] text-gray-400">
            {baseline}% → <Text className="font-bold text-gray-600">{latest}%</Text>
          </Text>
          <DeltaPill value={delta} />
        </View>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* baseline ghost fill */}
        <View
          style={{
            position: "absolute",
            height: "100%",
            width: `${baseline}%`,
            backgroundColor: color,
            opacity: 0.22,
            borderRadius: 999,
          }}
        />
        {/* latest fill */}
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 999,
            backgroundColor: color,
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          }}
        />
      </View>
    </View>
  );
};

interface ProgressOverTimeProps {
  progress: PatientProgress;
}

export const ProgressOverTime: React.FC<ProgressOverTimeProps> = ({ progress }) => {
  const dir = DIRECTION_META[progress.direction];

  // No baseline at all — nothing to anchor progress to.
  if (!progress.hasBaseline) {
    return (
      <View className="items-center py-6 px-6">
        <Ionicons name="flag-outline" size={26} color="#CBD5E1" />
        <Text className="text-sm text-gray-400 text-center mt-2">
          The first completed assessment becomes the initial screening baseline. None on record yet.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* ── Direction banner + summary ─────────────────────────────── */}
      <View className="rounded-2xl p-3.5 mb-3" style={{ backgroundColor: dir.bg }}>
        <View className="flex-row items-center gap-2 mb-1.5">
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: dir.color + "22" }}
          >
            <Ionicons name={dir.icon} size={15} color={dir.color} />
          </View>
          <Text className="text-sm font-extrabold" style={{ color: dir.color }}>
            {dir.label}
          </Text>
          {progress.scoreDelta !== null && (
            <View className="ml-auto">
              <DeltaPill value={progress.scoreDelta} suffix="/30" />
            </View>
          )}
        </View>
        <Text className="text-[12px] text-gray-600 leading-5">{progress.summary}</Text>
      </View>

      {/* ── Baseline → Latest score comparison ─────────────────────── */}
      <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 p-3.5 mb-3">
        <View className="flex-1 items-center">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Baseline</Text>
          <Text className="text-2xl font-extrabold text-gray-800">
            {progress.baselineScore ?? "—"}
            <Text className="text-sm text-gray-400">/30</Text>
          </Text>
          <Text className="text-[10px] text-gray-400 mt-0.5">{fmtDate(progress.baselineDate)}</Text>
        </View>

        <View className="items-center px-2">
          <Ionicons name="arrow-forward" size={18} color="#CBD5E1" />
          {progress.daysBetween !== null && (
            <Text className="text-[9px] text-gray-400 mt-1">{progress.daysBetween}d</Text>
          )}
        </View>

        <View className="flex-1 items-center">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Latest</Text>
          <Text className="text-2xl font-extrabold" style={{ color: dir.color }}>
            {progress.latestScore ?? "—"}
            <Text className="text-sm text-gray-400">/30</Text>
          </Text>
          <Text className="text-[10px] text-gray-400 mt-0.5">{fmtDate(progress.latestDate)}</Text>
        </View>
      </View>

      {/* ── Severity change chip ───────────────────────────────────── */}
      {progress.hasComparison && progress.baselineSeverity && progress.latestSeverity && (
        <View className="flex-row items-center gap-2 mb-3 px-1">
          <Ionicons
            name={progress.severityImproved === true ? "shield-checkmark" : progress.severityImproved === false ? "warning" : "shield"}
            size={13}
            color={progress.severityImproved === true ? "#16A34A" : progress.severityImproved === false ? "#DC2626" : "#64748B"}
          />
          <Text className="text-[11px] text-gray-500">
            Severity: <Text className="font-semibold capitalize text-gray-700">{progress.baselineSeverity}</Text>
            {" → "}
            <Text className="font-semibold capitalize text-gray-700">{progress.latestSeverity}</Text>
          </Text>
        </View>
      )}

      {/* ── Per-section change ─────────────────────────────────────── */}
      {progress.hasComparison ? (
        <View className="bg-white rounded-2xl border border-gray-100 p-3.5 mb-1">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Change by Domain
          </Text>
          {progress.sectionDeltas.map((s) => (
            <SectionDeltaBar
              key={s.section}
              section={s.section}
              baseline={s.baselinePercent}
              latest={s.latestPercent}
              delta={s.deltaPercent}
              color={BRAIN_AREA_BY_SECTION[s.section]?.color ?? "#3B82F6"}
            />
          ))}
          <Text className="text-[10px] text-gray-300 mt-1">
            Faint bar = initial screening · solid bar = latest assessment
          </Text>
        </View>
      ) : (
        <View className="bg-blue-50 rounded-2xl p-3 mb-1 flex-row items-center gap-2">
          <Ionicons name="information-circle-outline" size={15} color="#3B82F6" />
          <Text className="text-[11px] text-blue-500 flex-1">
            Domain-by-domain change will appear here once a second assessment is completed.
          </Text>
        </View>
      )}

      {/* ── Game engagement progress ───────────────────────────────── */}
      {progress.gameProgress && (
        <View className="flex-row items-center gap-2 bg-violet-50 rounded-2xl p-3 mt-2">
          <Ionicons name="game-controller" size={15} color="#8B5CF6" />
          <Text className="text-[11px] text-gray-600 flex-1">
            Brain-game accuracy moved from{" "}
            <Text className="font-bold text-gray-800">{progress.gameProgress.firstAvg}%</Text> to{" "}
            <Text className="font-bold text-gray-800">{progress.gameProgress.recentAvg}%</Text>
          </Text>
          <DeltaPill value={progress.gameProgress.delta} suffix="pts" />
        </View>
      )}
    </View>
  );
};
