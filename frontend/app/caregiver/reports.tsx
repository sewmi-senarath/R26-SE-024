import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { ReportTimeframe, ReportType } from '../../src/types/caregiver.types';

const PATIENTS = ['All Patients', 'Eleanor Vance', 'Robert Chen', 'Margaret Hughes', 'Arthur Pendelton'];
const REPORT_TYPES: ReportType[] = ['Comprehensive Care Summary', 'Medication Adherence', 'Task Completion', 'Behavioral Incident Log'];
const TIMEFRAMES: ReportTimeframe[] = ['daily', 'weekly', 'monthly'];

export default function ReportsScreen() {
  const [timeframe, setTimeframe]       = useState<ReportTimeframe>('weekly');
  const [patient, setPatient]           = useState('All Patients');
  const [reportType, setReportType]     = useState<ReportType>('Comprehensive Care Summary');
  const [showPatientDD, setShowPatientDD] = useState(false);
  const [showTypeDD, setShowTypeDD]     = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [generated, setGenerated]       = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    await new Promise((r) => setTimeout(r, 1500));
    setGenerating(false);
    setGenerated(true);
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Reports</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Generate consent-based care summaries</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Generate Report Card */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 }}>
            Generate Report
          </Text>

          {/* Timeframe tabs */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Timeframe</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: Colors.borderLight, borderRadius: 14, padding: 4 }}>
            {TIMEFRAMES.map((tf) => (
              <TouchableOpacity
                key={tf}
                onPress={() => setTimeframe(tf)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 9,
                  borderRadius: 10,
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

          {/* Patient dropdown */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Patient</Text>
          <View style={{ position: 'relative', marginBottom: 16, zIndex: 20 }}>
            <TouchableOpacity
              onPress={() => { setShowPatientDD(!showPatientDD); setShowTypeDD(false); }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: 14, borderRadius: 14, backgroundColor: Colors.background,
                borderWidth: 1.5, borderColor: showPatientDD ? Colors.primary : Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '500' }}>{patient}</Text>
              <Ionicons name={showPatientDD ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <Dropdown visible={showPatientDD} options={PATIENTS} onSelect={setPatient} onClose={() => setShowPatientDD(false)} />
          </View>

          {/* Report type dropdown */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Report Type</Text>
          <View style={{ position: 'relative', marginBottom: 20, zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => { setShowTypeDD(!showTypeDD); setShowPatientDD(false); }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: 14, borderRadius: 14, backgroundColor: Colors.background,
                borderWidth: 1.5, borderColor: showTypeDD ? Colors.primary : Colors.border,
              }}
            >
              <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: '500' }} numberOfLines={1}>{reportType}</Text>
              <Ionicons name={showTypeDD ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <Dropdown visible={showTypeDD} options={REPORT_TYPES} onSelect={(v) => setReportType(v as ReportType)} onClose={() => setShowTypeDD(false)} />
          </View>

          {/* Consent badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, padding: 10, borderRadius: 12, backgroundColor: Colors.successSoft }}>
            <Ionicons name="shield-checkmark-outline" size={15} color={Colors.success} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.success }}>Family consent verified for data sharing</Text>
          </View>

          {/* Generate button */}
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            style={{
              height: 50, borderRadius: 16, backgroundColor: generating ? Colors.primaryLight : Colors.primary,
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

        {/* Report Preview Card */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          borderWidth: 1, borderColor: Colors.borderLight,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05, shadowRadius: 12, elevation: 1,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 }}>Report Preview</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 20 }}>
            {generated ? `${reportType} • ${patient}` : 'Care Summary • Eleanor Vance'}
          </Text>

          {!generated
            ? <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Ionicons name="document-outline" size={28} color={Colors.textMuted} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 }}>Ready to Generate</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center' }}>
                  Select your parameters above and tap "Generate Report" to preview.
                </Text>
              </View>
            : <View style={{ paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {['Tasks: 8/10', 'Meds: 95%', 'Mood: Good'].map((item) => (
                    <View key={item} style={{ flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
                  Weekly care summary generated successfully. All patient interactions logged and verified.
                </Text>
              </View>
          }

          {/* Export buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, height: 46, borderRadius: 14,
                borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
              }}
            >
              <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary }}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, height: 46, borderRadius: 14,
                backgroundColor: Colors.primary,
                shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
              }}
            >
              <Ionicons name="download-outline" size={16} color={Colors.white} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.white }}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}