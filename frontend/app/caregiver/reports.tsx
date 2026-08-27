import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import {
  PatientDetail, ReportTimeframe, TaskCompletionReport,
} from '../../src/types/caregiver.types';
import { fetchPatients } from '../../src/services/caregiver/patientService';
import { fetchTaskCompletionReport } from '../../src/services/caregiver/Reportservice';
import { exportReportAsCSV, exportReportAsPDF } from '../../src/utils/Reportexport';

const TIMEFRAMES: ReportTimeframe[] = ['daily', 'weekly', 'monthly'];
const ALL_PATIENTS = 'All Patients';

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ReportsScreen() {
  const [timeframe, setTimeframe]   = useState<ReportTimeframe>('weekly');
  const [patient, setPatient]       = useState(ALL_PATIENTS);
  const [showPatientDD, setShowPatientDD] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [report, setReport]         = useState<TaskCompletionReport | null>(null);
  const [exporting, setExporting]   = useState<'csv' | 'pdf' | null>(null);

  // ── Patients (shared by both cards) ──────────────────────────────────────
  const [cogPatients, setCogPatients]   = useState<PatientDetail[]>([]);
  const [cogLoading, setCogLoading]     = useState(true);
  const [cogPatientId, setCogPatientId] = useState<string | null>(null);
  const [showCogDD, setShowCogDD]       = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPatients();
        if (mounted) setCogPatients(data);
      } catch {
        // Non-fatal — the card shows an empty state if patients can't load.
      } finally {
        if (mounted) setCogLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedCogPatient = cogPatients.find((p) => p.id === cogPatientId) ?? null;
  // Cognitive data is keyed on the linked registered-patient account id, not
  // the caregiver-side Patient document id.
  const selectedCogIsLinked = !!selectedCogPatient?.registeredPatientId;
  const canViewCognitiveReport = !!selectedCogPatient && selectedCogIsLinked;

  const handleViewCognitiveReport = () => {
    if (!selectedCogPatient || !selectedCogPatient.registeredPatientId) return;
    router.push({
      pathname: '/caregiver/patient-report',
      params: {
        patientId: selectedCogPatient.registeredPatientId,
        patientName: selectedCogPatient.name,
      },
    } as any);
  };

  // Real names from the database, plus the "everyone" option.
  const patientOptions = [ALL_PATIENTS, ...cogPatients.map((p) => p.name)];

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setReport(null);
      const result = await fetchTaskCompletionReport(timeframe, patient);
      setReport(result);
    } catch (error) {
      console.error('Report generation failed:', error);
      Alert.alert('Error', 'Could not generate the report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Changing a parameter invalidates the shown report, otherwise the preview
  // would claim to be "Weekly" while displaying last month's numbers.
  const changeTimeframe = (tf: ReportTimeframe) => {
    setTimeframe(tf);
    setReport(null);
  };
  const changePatient = (name: string) => {
    setPatient(name);
    setReport(null);
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!report) return;
    try {
      setExporting(format);
      if (format === 'csv') await exportReportAsCSV(report);
      else                  await exportReportAsPDF(report);
    } catch (error: any) {
      console.error(`${format} export failed:`, error);
      Alert.alert('Export failed', error?.message || 'Could not export the report.');
    } finally {
      setExporting(null);
    }
  };

  const Dropdown = ({
    visible, options, onSelect, onClose,
  }: { visible: boolean; options: string[]; onSelect: (v: string) => void; onClose: () => void }) => {
    if (!visible) return null;
    return (
      <View style={{
        position: 'absolute', top: 52, left: 0, right: 0, zIndex: 999,
        backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1,
        borderColor: Colors.border, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
      }}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt}
            onPress={() => { onSelect(opt); onClose(); }}
            style={{
              padding: 14,
              backgroundColor: Colors.white,
              borderBottomWidth: i < options.length - 1 ? 1 : 0,
              borderBottomColor: Colors.borderLight,
            }}
          >
            <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '500' }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ── Small presentational pieces ──────────────────────────────────────────
  const StatBox = ({ value, label, color }: { value: string; label: string; color: string }) => (
    <View style={{
      flex: 1, backgroundColor: Colors.background, borderRadius: 14,
      paddingVertical: 12, alignItems: 'center',
      borderWidth: 1, borderColor: Colors.borderLight,
    }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{value}</Text>
      <Text style={{
        fontSize: 9, fontWeight: '700', color: Colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );

  const BreakdownRow = ({ label, total, completed, rate }: {
    label: string; total: number; completed: number; rate: number;
  }) => (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textPrimary }}>
          {titleCase(label)}
        </Text>
        <Text style={{ fontSize: 11, color: Colors.textMuted }}>
          {completed}/{total} · {rate}%
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.borderLight, overflow: 'hidden' }}>
        <View style={{
          height: 6, borderRadius: 3, width: `${rate}%`,
          backgroundColor: rate >= 75 ? Colors.success : rate >= 40 ? '#F97316' : '#DC2626',
        }} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.replace('/caregiver/more')}
            style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Reports</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Care summaries and cognitive progress</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cognitive Report Card (unchanged) ── */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bar-chart-outline" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>Cognitive Report</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>
                Baseline screening, progress over time & brain-area breakdown
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>Patient</Text>
          {cogLoading ? (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>Loading patients…</Text>
            </View>
          ) : cogPatients.length === 0 ? (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, color: Colors.textMuted }}>No patients found. Add a patient first.</Text>
            </View>
          ) : (
            <View style={{ position: 'relative', zIndex: 30 }}>
              <TouchableOpacity
                onPress={() => { setShowCogDD(!showCogDD); setShowPatientDD(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: 14, borderRadius: 14, backgroundColor: Colors.background,
                  borderWidth: 1.5, borderColor: showCogDD ? Colors.primary : Colors.border,
                }}
              >
                <Text style={{ fontSize: 14, color: selectedCogPatient ? Colors.textPrimary : Colors.textMuted, fontWeight: '500' }}>
                  {selectedCogPatient ? selectedCogPatient.name : 'Select a patient'}
                </Text>
                <Ionicons name={showCogDD ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <Dropdown
                visible={showCogDD}
                options={cogPatients.map((p) => p.name)}
                onSelect={(name) => {
                  const match = cogPatients.find((p) => p.name === name);
                  if (match) setCogPatientId(match.id);
                }}
                onClose={() => setShowCogDD(false)}
              />
            </View>
          )}

          {selectedCogPatient && !selectedCogIsLinked && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: '#FFFBEB' }}>
              <Ionicons name="information-circle-outline" size={15} color="#D97706" />
              <Text style={{ fontSize: 12, color: '#B45309', flex: 1 }}>
                {selectedCogPatient.name} isn't linked to a registered patient account yet, so there's no cognitive data to show. Link an account when editing the patient.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleViewCognitiveReport}
            disabled={!canViewCognitiveReport}
            style={{
              height: 50, borderRadius: 16, marginTop: 16,
              backgroundColor: canViewCognitiveReport ? Colors.primary : Colors.borderLight,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
              shadowColor: canViewCognitiveReport ? Colors.primary : 'transparent',
              shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
              elevation: canViewCognitiveReport ? 4 : 0,
            }}
          >
            <Ionicons name="analytics-outline" size={18} color={canViewCognitiveReport ? Colors.white : Colors.textMuted} />
            <Text style={{ color: canViewCognitiveReport ? Colors.white : Colors.textMuted, fontWeight: '700', fontSize: 15 }}>
              View Cognitive Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Task Completion Report Card ── */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark-done-outline" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>Task Completion Report</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>
                Completion rate, category & priority breakdown
              </Text>
            </View>
          </View>

          {/* Timeframe tabs */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 }}>Timeframe</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: Colors.borderLight, borderRadius: 14, padding: 4 }}>
            {TIMEFRAMES.map((tf) => (
              <TouchableOpacity
                key={tf}
                onPress={() => changeTimeframe(tf)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10,
                  backgroundColor: timeframe === tf ? Colors.white : 'transparent',
                  shadowColor: timeframe === tf ? Colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
                  elevation: timeframe === tf ? 2 : 0,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: timeframe === tf ? Colors.primary : Colors.textMuted, textTransform: 'capitalize' }}>
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Patient dropdown — real names, no hardcoded list */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Patient</Text>
          <View style={{ position: 'relative', marginBottom: 20, zIndex: 20 }}>
            <TouchableOpacity
              onPress={() => { setShowPatientDD(!showPatientDD); setShowCogDD(false); }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: 14, borderRadius: 14, backgroundColor: Colors.background,
                borderWidth: 1.5, borderColor: showPatientDD ? Colors.primary : Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '500' }}>{patient}</Text>
              <Ionicons name={showPatientDD ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <Dropdown
              visible={showPatientDD}
              options={patientOptions}
              onSelect={changePatient}
              onClose={() => setShowPatientDD(false)}
            />
          </View>

          {/* Generate button */}
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            style={{
              height: 50, borderRadius: 16,
              backgroundColor: generating ? Colors.primaryLight : Colors.primary,
              alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
              shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            {generating
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <>
                  <Ionicons name="document-text-outline" size={18} color={Colors.white} />
                  <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 15 }}>Generate Report</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* ── Report Preview Card ── */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05, shadowRadius: 12, elevation: 1,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 }}>Report Preview</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 20 }}>
            {report
              ? `${report.startDate} to ${report.endDate} · ${report.patientFilter}`
              : 'No report generated yet'}
          </Text>

          {!report ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name="document-outline" size={28} color={Colors.textMuted} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 }}>Ready to Generate</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center' }}>
                Select your parameters above and tap "Generate Report".
              </Text>
            </View>
          ) : report.summary.total === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 26 }}>
              <Ionicons name="calendar-outline" size={26} color={Colors.textMuted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 10 }}>
                No tasks in this period
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                Try a longer timeframe or a different patient.
              </Text>
            </View>
          ) : (
            <View>
              {/* Summary stats */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <StatBox value={String(report.summary.total)}     label="Total"    color={Colors.textPrimary} />
                <StatBox value={String(report.summary.completed)} label="Done"     color={Colors.success} />
                <StatBox value={String(report.summary.overdue)}   label="Overdue"  color="#DC2626" />
                <StatBox value={`${report.summary.completionRate}%`} label="Rate"  color={Colors.primary} />
              </View>

              {/* By category */}
              {report.byCategory.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    By Category
                  </Text>
                  {report.byCategory.map((c) => (
                    <BreakdownRow key={c.category} label={c.category} total={c.total} completed={c.completed} rate={c.rate} />
                  ))}
                </>
              )}

              {/* By priority */}
              {report.byPriority.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 10 }}>
                    By Priority
                  </Text>
                  {report.byPriority.map((p) => (
                    <BreakdownRow key={p.priority} label={p.priority} total={p.total} completed={p.completed} rate={p.rate} />
                  ))}
                </>
              )}
            </View>
          )}

          {/* Export buttons — disabled until there's something to export */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => handleExport('csv')}
              disabled={!report || exporting !== null}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, height: 46, borderRadius: 14,
                borderWidth: 1.5, borderColor: Colors.border,
                backgroundColor: Colors.white,
                opacity: !report || exporting !== null ? 0.5 : 1,
              }}
            >
              {exporting === 'csv'
                ? <ActivityIndicator size="small" color={Colors.textSecondary} />
                : <>
                    <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>CSV</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleExport('pdf')}
              disabled={!report || exporting !== null}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, height: 46, borderRadius: 14,
                backgroundColor: Colors.primary,
                shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
                opacity: !report || exporting !== null ? 0.5 : 1,
              }}
            >
              {exporting === 'pdf'
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <>
                    <Ionicons name="download-outline" size={16} color={Colors.white} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.white }}>PDF</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          {!report && (
            <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 10 }}>
              Generate a report to enable export
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}