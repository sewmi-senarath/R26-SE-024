import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Animated, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { registerBackgroundAlerts, triggerAlertNow } from '../../src/services/backgroundAlerts';
import { extractObjectKeyword, findAndSpeakLocation, normaliseKeyword } from '../../src/services/voiceCommands';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';
const API = `${BASE_URL}/api/admin/behavior`;

const ACTIVITY_ICONS: Record<string, any> = {
  eating: 'restaurant', sleeping: 'bed', walking: 'walk',
  wandering: 'warning', sitting: 'person', medication: 'medkit',
  bathing: 'water', exercise: 'barbell', socializing: 'people',
};
const ACTIVITY_COLORS: Record<string, string> = {
  eating: '#f97316', sleeping: '#6366f1', walking: '#22c55e',
  wandering: '#ef4444', sitting: '#94a3b8', medication: '#3b82f6',
  bathing: '#06b6d4', exercise: '#a855f7', socializing: '#ec4899',
};

export default function PatientHomeScreen() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [routine, setRoutine] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'error' | 'checking'>('checking');
  const [bgAlertsOn, setBgAlertsOn] = useState(false);

  // Voice search state
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSearching, setVoiceSearching] = useState(false);
  const [voiceResult, setVoiceResult] = useState<{ found: boolean; message: string; distanceLabel?: string } | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const patientRef = useRef<any>(null);
  const gpsRef = useRef<{ lat: number; lng: number } | null>(null);

  const now = new Date();
  const currentHour = now.getHours();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Pulse animation
  useEffect(() => {
    if (voiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [voiceActive]);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const stored = await AsyncStorage.getItem('patient');
      if (!stored) { router.replace('/patient/auth'); return; }
      const p = JSON.parse(stored);
      setPatient(p);
      patientRef.current = p;

      // Get GPS silently in background
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            .then(pos => {
              gpsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            })
            .catch(() => {});
        }
      });

      const [routineRes, alertRes] = await Promise.all([
        axios.get(`${API}/pattern/${p.id}`, { timeout: 8000 }),
        axios.post(`${API}/voice-alert`, { patientId: p.id }, { timeout: 8000 })
      ]);

      if (routineRes.data.status === 'success') setRoutine(routineRes.data.routine || {});

      if (alertRes.data.success && alertRes.data.alert?.speak) {
        setAlert(alertRes.data.alert);
        Speech.speak(alertRes.data.alert.message, { language: 'en-US', rate: 0.9, pitch: 1.0 });
      }

      setConnectionStatus('ok');
      const ok = await registerBackgroundAlerts();
      setBgAlertsOn(ok);
    } catch (err: any) {
      setConnectionStatus('error');
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError(`📡 Cannot connect to ${BASE_URL}\n\nCheck WiFi and backend.`);
      } else if (err.code === 'ECONNABORTED') {
        setError(`⏱ Connection timed out.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Unknown error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Voice search (tap mic → type what you want to find → search) ──────────
  const openVoiceSearch = () => {
    setVoiceActive(true);
    setVoiceQuery('');
    setVoiceResult(null);
  };

  const closeVoiceSearch = () => {
    setVoiceActive(false);
    setVoiceQuery('');
    setVoiceResult(null);
    Keyboard.dismiss();
  };

  const handleVoiceSearch = async (queryText?: string) => {
    const text = (queryText ?? voiceQuery).trim();
    if (!text) return;
    Keyboard.dismiss();

    const keyword = extractObjectKeyword(text) || normaliseKeyword(text.split(' ').pop() || text);
    const p = patientRef.current;
    if (!p?.id) return;

    setVoiceSearching(true);
    setVoiceResult(null);
    Speech.speak(`Searching for your ${keyword}...`, { language: 'en-US', rate: 0.9 });

    // Refresh GPS right before search for accurate distance
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        gpsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {}

    const result = await findAndSpeakLocation(
      p.id, keyword, p.firstName || 'there',
      gpsRef.current?.lat, gpsRef.current?.lng
    );
    setVoiceResult(result);
    setVoiceSearching(false);
  };

  // Quick search chips
  const QUICK_ITEMS = ['toothbrush', 'glasses', 'keys', 'medicine', 'phone', 'remote'];

  const speakAlert = () => {
    if (patient?.id) triggerAlertNow(patient.id);
    else if (alert?.message) Speech.speak(alert.message, { language: 'en-US', rate: 0.9 });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('patient');
    router.replace('/patient/auth');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  const currentActivity = routine[String(currentHour)];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#3b82f6" />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {patient?.firstName || 'Patient'} 👋</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: connectionStatus === 'ok' ? '#052e16' : '#450a0a' }]}>
          <Ionicons name={connectionStatus === 'ok' ? 'checkmark-circle' : 'warning'} size={14}
            color={connectionStatus === 'ok' ? '#4ade80' : '#fca5a5'} />
          <Text style={[styles.statusText, { color: connectionStatus === 'ok' ? '#4ade80' : '#fca5a5' }]}>
            {connectionStatus === 'ok' ? `Connected · ${BASE_URL}` : `Offline · ${BASE_URL}`}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Voice Object Finder Panel ──────────────────────────────── */}
        <View style={styles.voicePanel}>
          <View style={styles.voiceHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.voicePanelTitle}>🔍 Find My Object</Text>
              <Text style={styles.voicePanelSub}>
                {voiceActive
                  ? 'Tap 🎤 on keyboard to speak, or type below'
                  : 'Tap mic — then speak or type what you lost'}
              </Text>
            </View>
            <TouchableOpacity onPress={voiceActive ? closeVoiceSearch : openVoiceSearch} activeOpacity={0.8}>
              <Animated.View style={[styles.micBtn, voiceActive && styles.micBtnActive, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name={voiceActive ? 'close' : 'mic'} size={26} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {voiceActive && (
            <>
              {/* Voice hint bar */}
              <View style={styles.voiceHint}>
                <Ionicons name="mic-circle" size={18} color="#3b82f6" />
                <Text style={styles.voiceHintText}>
                  Tap 🎤 on your keyboard → say "where is my toothbrush"
                </Text>
              </View>

              {/* Text input — use OS voice keyboard */}
              <View style={styles.voiceInputRow}>
                <Ionicons name="search" size={18} color="#64748b" />
                <TextInput
                  style={styles.voiceInput}
                  placeholder='Say or type: "toothbrush"'
                  placeholderTextColor="#475569"
                  value={voiceQuery}
                  onChangeText={(t) => {
                    setVoiceQuery(t);
                    // Auto-search when user finishes speaking (dictation ends with space or period)
                    if (t.endsWith(' ') || t.endsWith('.') || t.endsWith('?')) {
                      handleVoiceSearch(t.trim().replace(/[.?]$/, ''));
                    }
                  }}
                  onSubmitEditing={() => handleVoiceSearch()}
                  returnKeyType="search"
                  autoFocus
                  autoCorrect={false}
                />
                {voiceQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleVoiceSearch()} style={styles.goBtn}>
                    {voiceSearching
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.goBtnText}>Find</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick-tap chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {QUICK_ITEMS.map(item => (
                  <TouchableOpacity key={item} style={styles.chip} onPress={() => handleVoiceSearch(item)}>
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Search result */}
          {voiceResult && (
            <View style={[styles.voiceResult, { backgroundColor: voiceResult.found ? '#052e16' : '#450a0a' }]}>
              <Ionicons
                name={voiceResult.found ? 'location' : 'help-circle'}
                size={20}
                color={voiceResult.found ? '#4ade80' : '#fca5a5'}
              />
              <View style={{ flex: 1 }}>
                {voiceResult.distanceLabel && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate" size={12} color="#38bdf8" />
                    <Text style={styles.distanceBadgeText}>{voiceResult.distanceLabel}</Text>
                  </View>
                )}
                <Text style={[styles.voiceResultText, { color: voiceResult.found ? '#4ade80' : '#fca5a5' }]}>
                  {voiceResult.message}
                </Text>
                <View style={styles.voiceResultActions}>
                  <TouchableOpacity
                    onPress={() => voiceResult.spokenMessage && Speech.speak(voiceResult.spokenMessage, { language: 'en-US', rate: 0.85 })}
                    style={styles.rehearBtn}
                  >
                    <Ionicons name="volume-medium" size={13} color="#94a3b8" />
                    <Text style={styles.rehearText}>Hear again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Speech.stop()} style={styles.stopSpeakBtn}>
                    <Ionicons name="stop-circle" size={13} color="#f87171" />
                    <Text style={styles.stopSpeakText}>Stop</Text>
                  </TouchableOpacity>
                  {/* View on Map button — only if GPS coordinates exist */}
                  {voiceResult.found && voiceResult.objLat && voiceResult.objLng && (
                    <TouchableOpacity
                      style={styles.mapBtn}
                      onPress={() => {
                        Speech.stop();
                        router.push({
                          pathname: '/patient/navigate',
                          params: {
                            objectName: voiceResult.message.split('→')[0].trim(),
                            objLat: String(voiceResult.objLat),
                            objLng: String(voiceResult.objLng),
                            roomLabel: voiceResult.roomLabel || 'Unknown',
                            locationDetail: voiceResult.locationDetail || '',
                            timeLabel: voiceResult.timeLabel || '',
                          },
                        });
                      }}
                    >
                      <Ionicons name="map" size={13} color="#0f172a" />
                      <Text style={styles.mapBtnText}>View on Map</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Voice Alert Banner */}
        {alert && (
          <View style={styles.alertBanner}>
            <TouchableOpacity style={styles.alertIcon} onPress={speakAlert}>
              <Ionicons name="play" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Voice Reminder</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
            <TouchableOpacity onPress={() => Speech.stop()} style={styles.stopAlertBtn}>
              <Ionicons name="stop-circle" size={26} color="#f87171" />
            </TouchableOpacity>
          </View>
        )}

        {/* Current Activity */}
        {currentActivity ? (
          <View style={styles.currentActivity}>
            <Text style={styles.sectionLabel}>NOW · {timeStr}</Text>
            <View style={styles.currentRow}>
              <View style={[styles.activityIcon, { backgroundColor: (ACTIVITY_COLORS[currentActivity] || '#94a3b8') + '22' }]}>
                <Ionicons name={ACTIVITY_ICONS[currentActivity] || 'help'} size={32} color={ACTIVITY_COLORS[currentActivity] || '#94a3b8'} />
              </View>
              <View>
                <Text style={styles.currentLabel}>Expected Activity</Text>
                <Text style={styles.currentName}>{currentActivity.charAt(0).toUpperCase() + currentActivity.slice(1)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Daily Routine */}
        {Object.keys(routine).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR DAILY ROUTINE</Text>
            {Object.entries(routine)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([hour, activity]) => {
                const h = parseInt(hour);
                const isPast = h < currentHour;
                const isCurrent = h === currentHour;
                const color = ACTIVITY_COLORS[activity] || '#94a3b8';
                return (
                  <View key={hour} style={[styles.routineRow, isCurrent && styles.routineRowActive]}>
                    <Text style={[styles.routineTime, isPast && styles.dimText]}>{String(h).padStart(2, '0')}:00</Text>
                    <View style={[styles.routineDot, { backgroundColor: isCurrent ? color : isPast ? '#334155' : color + '44' }]} />
                    <Ionicons name={ACTIVITY_ICONS[activity] || 'help-circle'} size={18} color={isCurrent ? color : isPast ? '#475569' : color} />
                    <Text style={[styles.routineActivity, isPast && styles.dimText]}>
                      {activity.charAt(0).toUpperCase() + activity.slice(1)}
                    </Text>
                    {isCurrent && <View style={styles.nowBadge}><Text style={styles.nowText}>NOW</Text></View>}
                    {isPast && <Ionicons name="checkmark-circle" size={16} color="#22c55e" />}
                  </View>
                );
              })}
          </View>
        ) : (
          <View style={styles.noRoutine}>
            <Ionicons name="analytics-outline" size={40} color="#334155" />
            <Text style={styles.noRoutineText}>No routine trained yet</Text>
            <Text style={styles.noRoutineSub}>Upload behavior CSV and click Train AI Model on web portal</Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/patient/ar-vision')}>
              <Ionicons name="camera" size={28} color="#3b82f6" />
              <Text style={styles.actionLabel}>Detect Objects</Text>
              <Text style={styles.actionSub}>Save location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={speakAlert}>
              <Ionicons name="volume-high" size={28} color="#a855f7" />
              <Text style={styles.actionLabel}>Speak Reminder</Text>
              <Text style={styles.actionSub}>Hear today's alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={openVoiceSearch}>
              <Ionicons name="search" size={28} color="#10b981" />
              <Text style={styles.actionLabel}>Find Object</Text>
              <Text style={styles.actionSub}>Where is my...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/patient/memories')}>
              <Ionicons name="images" size={28} color="#f59e0b" />
              <Text style={styles.actionLabel}>My Memories</Text>
              <Text style={styles.actionSub}>View saved photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Card */}
        <View style={styles.patientCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{patient?.firstName?.[0] || '?'}</Text>
          </View>
          <View>
            <Text style={styles.patientName}>{patient?.firstName} {patient?.lastName}</Text>
            <Text style={styles.patientCode}>{patient?.customerCode}</Text>
            {bgAlertsOn && <Text style={styles.bgBadge}>🔔 Background alerts active</Text>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '900', color: '#f1f5f9', marginBottom: 4 },
  dateText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  timeText: { color: '#3b82f6', fontSize: 18, fontWeight: '900', marginTop: 2 },
  logoutBtn: { padding: 10, backgroundColor: '#1e293b', borderRadius: 12 },

  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 12, marginBottom: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },

  errorBox: { backgroundColor: '#450a0a', borderRadius: 16, padding: 16, marginBottom: 16 },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', lineHeight: 20, marginBottom: 10 },
  retryBtn: { backgroundColor: '#7f1d1d', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  retryText: { color: '#fca5a5', fontWeight: '700', fontSize: 13 },

  // Voice Panel
  voicePanel: { backgroundColor: '#1e293b', borderRadius: 24, padding: 18, marginBottom: 16, gap: 12 },
  voiceHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voicePanelTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '900' },
  voicePanelSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  micBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  micBtnActive: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 },
  voiceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: '#3b82f6' },
  voiceInput: { flex: 1, color: '#f1f5f9', fontSize: 15, paddingVertical: 12, fontWeight: '500' },
  goBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  goBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  chipsScroll: { marginTop: -4 },
  chip: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  voiceResult: { borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  voiceResultText: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0c4a6e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  distanceBadgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '900' },
  voiceResultActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  rehearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  rehearText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  stopSpeakBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  stopSpeakText: { color: '#f87171', fontSize: 11, fontWeight: '700' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  mapBtnText: { color: '#0f172a', fontSize: 11, fontWeight: '900' },
  voiceHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1d4ed8' },
  voiceHintText: { color: '#93c5fd', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1c1917', borderRadius: 20, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#78350f' },
  alertIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { color: '#fbbf24', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  alertMessage: { color: '#fef3c7', fontWeight: '600', fontSize: 13, marginTop: 2, lineHeight: 18 },
  stopAlertBtn: { padding: 4 },

  currentActivity: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  activityIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  currentLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  currentName: { color: '#f1f5f9', fontSize: 22, fontWeight: '900' },

  section: { marginBottom: 20 },
  sectionLabel: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginBottom: 4 },
  routineRowActive: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  routineTime: { color: '#475569', fontSize: 13, fontWeight: '700', width: 46 },
  routineDot: { width: 8, height: 8, borderRadius: 4 },
  routineActivity: { color: '#cbd5e1', fontSize: 15, fontWeight: '700', flex: 1 },
  dimText: { color: '#334155' },
  nowBadge: { backgroundColor: '#1d4ed8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  nowText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  noRoutine: { alignItems: 'center', padding: 40, gap: 8, marginBottom: 16 },
  noRoutineText: { color: '#475569', fontSize: 16, fontWeight: '700' },
  noRoutineSub: { color: '#334155', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 20, padding: 18, alignItems: 'center', gap: 6 },
  actionLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionSub: { color: '#475569', fontSize: 10, textAlign: 'center' },

  patientCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginTop: 4 },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  patientName: { color: '#f1f5f9', fontSize: 16, fontWeight: '800' },
  patientCode: { color: '#3b82f6', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bgBadge: { color: '#22c55e', fontSize: 10, fontWeight: '700', marginTop: 4 },
});
