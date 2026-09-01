import { getPatientDifficultyReport } from "@/src/api/gameSessionApi";
import { GAME_CONFIGS } from "@/src/constants/games";
import { DifficultyGameReport } from "@/src/types/games.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { DifficultyBadge } from "../games/DifficultyBadge";
import { TrendBarChart, TrendPoint } from "../games/shared/ProgressCharts";

interface Props {
  patientId?: string | null;
}

const METRIC_META: {
  key: "accuracy" | "correctnessRate" | "speedScore" | "composite";
  label: string;
  color: string;
}[] = [
  { key: "accuracy", label: "Accuracy", color: "#3B82F6" },
  { key: "correctnessRate", label: "Correct answers", color: "#8B5CF6" },
  { key: "speedScore", label: "Speed", color: "#F59E0B" },
  { key: "composite", label: "Overall performance", color: "#16A34A" },
];

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <View className="flex-row items-center gap-2 mb-3">
    <Ionicons name="trending-up-outline" size={16} color="#3b82f6" />
    <View>
      <Text className="text-sm font-bold text-gray-800">{title}</Text>
      {subtitle ? (
        <Text className="text-[11px] text-gray-400">{subtitle}</Text>
      ) : null}
    </View>
  </View>
);

const MetricBar: React.FC<{ label: string; value: number | null; color: string }> = ({
  label,
  value,
  color,
}) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-1">
        <Text className="text-[11px] text-gray-500">{label}</Text>
        <Text className="text-[11px] font-bold text-gray-700">
          {value == null ? "-" : `${Math.round(value)}%`}
        </Text>
      </View>
      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
};

const ChangeTimeline: React.FC<{ report: DifficultyGameReport }> = ({ report }) => {
  if (!report.changeHistory.length) {
    return (
      <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <Ionicons name="lock-closed-outline" size={13} color="#94A3B8" />
        <Text className="text-[11px] text-gray-400 flex-1">
          No level changes yet - holding at {report.currentDifficulty} while more
          games are played.
        </Text>
      </View>
    );
  }

  // Newest change first.
  const ordered = [...report.changeHistory].reverse();

  return (
    <View className="mt-3 pt-3 border-t border-gray-50 gap-2.5">
      <Text className="text-[11px] font-semibold text-gray-500">
        Level changes over time
      </Text>
      {ordered.map((change, index) => {
        const up = change.direction === "up";
        return (
          <View key={index} className="flex-row gap-2.5">
            <Text style={{ fontSize: 16 }}>{up ? "⬆️" : "⬇️"}</Text>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <DifficultyBadge difficulty={change.from} size="sm" />
                <Text className="text-gray-300 text-xs">→</Text>
                <DifficultyBadge difficulty={change.to} size="sm" />
                {change.at ? (
                  <Text className="text-[10px] text-gray-400 ml-auto">
                    {formatDate(change.at)}
                  </Text>
                ) : null}
              </View>
              <Text className="text-[11px] text-gray-500 leading-4">
                {change.reason}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const AdaptiveDifficultySection: React.FC<Props> = ({ patientId }) => {
  const [reports, setReports] = useState<DifficultyGameReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getPatientDifficultyReport(patientId)
      .then((data) => {
        setReports(data);
        setError(null);
      })
      .catch((e) => setError(e?.message || "Could not load difficulty data."))
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalChanges = reports.reduce((sum, r) => sum + r.changeCount, 0);

  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
      <SectionHeading
        title="Adaptive Difficulty"
        subtitle="How each game's level is auto-tuned from accuracy, correctness & speed"
      />

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : error ? (
        <View className="items-center py-6">
          <Ionicons name="cloud-offline-outline" size={22} color="#CBD5E1" />
          <Text className="text-[11px] text-gray-400 mt-2">{error}</Text>
        </View>
      ) : reports.length === 0 ? (
        <View className="items-center py-6 px-4">
          <Ionicons name="game-controller-outline" size={24} color="#CBD5E1" />
          <Text className="text-xs text-gray-400 text-center mt-2 leading-5">
            Play a few brain games and the difficulty will start adjusting
            automatically. Every level change will be explained here.
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-[11px] text-gray-400 mb-3 leading-4">
            Difficulty is reviewed after every 3 games at a level. It moves up
            when performance is consistently strong and eases down when games get
            too hard - {totalChanges} automatic change
            {totalChanges === 1 ? "" : "s"} so far.
          </Text>

          <View className="gap-3">
            {reports.map((report) => {
              const config = GAME_CONFIGS[report.gameId];
              const trend: TrendPoint[] = report.recentScores.map((score, i) => ({
                label: `#${i + 1}`,
                percent: Math.round(score),
              }));

              return (
                <View
                  key={report.gameId}
                  className="rounded-2xl border border-gray-100 p-3.5"
                  style={{ backgroundColor: "#FAFAFA" }}
                >
                  {/* Header */}
                  <View className="flex-row items-center gap-2.5 mb-3">
                    <Text style={{ fontSize: 22 }}>{config?.icon ?? "🎮"}</Text>
                    <Text className="text-sm font-bold text-gray-900 flex-1">
                      {config?.title ?? report.gameId}
                    </Text>
                    <DifficultyBadge difficulty={report.currentDifficulty} size="sm" />
                  </View>

                  {/* Session count + average */}
                  <View className="flex-row gap-4 mb-3">
                    <View>
                      <Text className="text-base font-extrabold text-gray-900">
                        {report.totalSessions}
                      </Text>
                      <Text className="text-[10px] text-gray-400">Games played</Text>
                    </View>
                    <View>
                      <Text className="text-base font-extrabold text-gray-900">
                        {report.averageComposite == null
                          ? "-"
                          : `${report.averageComposite}%`}
                      </Text>
                      <Text className="text-[10px] text-gray-400">Recent average</Text>
                    </View>
                    <View>
                      <Text className="text-base font-extrabold text-gray-900">
                        {report.changeCount}
                      </Text>
                      <Text className="text-[10px] text-gray-400">Level changes</Text>
                    </View>
                  </View>

                  {/* Latest metric breakdown */}
                  {report.latestMetrics ? (
                    <View className="mb-1">
                      <Text className="text-[11px] font-semibold text-gray-500 mb-2">
                        Latest game breakdown
                      </Text>
                      {METRIC_META.map((m) => (
                        <MetricBar
                          key={m.key}
                          label={m.label}
                          value={report.latestMetrics?.[m.key] ?? null}
                          color={m.color}
                        />
                      ))}
                    </View>
                  ) : null}

                  {/* Composite trend */}
                  {trend.length > 1 ? (
                    <View className="mt-2">
                      <Text className="text-[11px] font-semibold text-gray-500 mb-1">
                        Performance trend
                      </Text>
                      <TrendBarChart data={trend} height={56} />
                    </View>
                  ) : null}

                  {/* Change timeline */}
                  <ChangeTimeline report={report} />
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};
