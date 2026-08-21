import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';
const API = `${BASE_URL}/api/admin/behavior`;

export default function PatientAuthScreen() {
  const [mode, setMode] = useState<'face' | 'id'>('face');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Camera state for face scan
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // ─── Mode 1: Log in with Registration Number (Fallback) ────────
  const handleIdLogin = async () => {
    const code = regNumber.trim().toUpperCase();
    if (!code) {
      setError('Please enter your Registration Number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/mobile-login`, { registrationNumber: code }, { timeout: 8000 });

      if (res.data.success) {
        await AsyncStorage.setItem('patient', JSON.stringify(res.data.patient));
        Speech.speak(`Welcome back, ${res.data.patient.firstName}`, { language: 'en-US' });
        router.replace('/patient');
      } else {
        setError(res.data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Mode 2: Log in with Face Scan (100% Free / Zero Typing) ───
  const handleFaceLogin = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    setError('');

    try {
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (!snap?.uri) {
        throw new Error('Camera failed to capture photo.');
      }

      const form = new FormData();
      form.append('file', { uri: snap.uri, name: 'login.jpg', type: 'image/jpeg' } as any);

      const res = await axios.post(`${API}/face-login`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 25000,
      });

      if (res.data.success && res.data.patient) {
        await AsyncStorage.setItem('patient', JSON.stringify(res.data.patient));
        Speech.speak(`Welcome back, ${res.data.patient.firstName}`, { language: 'en-US' });
        router.replace('/patient');
      } else {
        setError('Face not recognized. Please try again or use your ID Number.');
      }
    } catch (err: any) {
      handleError(err, true);
    } finally {
      setLoading(false);
    }
  };

  // ─── First-Time Face Registration (Enroll Face) ────────────────
  const handleEnrollFace = async () => {
    const code = enrollCode.trim().toUpperCase();
    if (!code || !cameraRef.current) {
      Alert.alert('Notice', 'Please enter your registration number and look at the camera.');
      return;
    }

    setEnrolling(true);
    try {
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (!snap?.uri) throw new Error('Camera capture failed.');

      const form = new FormData();
      form.append('file', { uri: snap.uri, name: 'enroll.jpg', type: 'image/jpeg' } as any);
      form.append('customerCode', code);

      const res = await axios.post(`${API}/register-face`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 25000,
      });

      if (res.data.success) {
        Speech.speak('Your face has been registered! You can now log in with your face.', { language: 'en-US' });
        Alert.alert('Success', 'Your face is registered! You can now log in instantly by scanning your face.');
        setShowEnrollModal(false);
        setEnrollCode('');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || err.message || 'Could not register face.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleError = (err: any, isFace = false) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      setError(`⏱ Connection timed out.\nMake sure the backend is running on ${BASE_URL}`);
    } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
      setError(`📡 Network Error — Cannot reach ${BASE_URL}\n\nCheck WiFi and verify backend is running on port 5000.`);
    } else if (err.response?.status === 404) {
      setError(isFace 
        ? '❌ Face not recognized or not registered yet.\nTap "Register Face" below or use ID Number.' 
        : '❌ Patient not registered.\nCheck your Registration Number.');
    } else {
      setError('⚠️ ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="brain" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>MemoCare</Text>
          <Text style={styles.tagline}>Personalized Dementia Care</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'face' && styles.tabBtnActive]}
              onPress={() => { setMode('face'); setError(''); }}
            >
              <Ionicons name="scan-outline" size={18} color={mode === 'face' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.tabText, mode === 'face' && styles.tabTextActive]}>Face Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'id' && styles.tabBtnActive]}
              onPress={() => { setMode('id'); setError(''); }}
            >
              <Ionicons name="keypad-outline" size={18} color={mode === 'id' ? '#fff' : '#94a3b8'} />
              <Text style={[styles.tabText, mode === 'id' && styles.tabTextActive]}>ID Number</Text>
            </TouchableOpacity>
          </View>

          {mode === 'face' ? (
            /* ─── FACE SCAN TAB ───────────────────────────────────────── */
            <View style={styles.faceTabContainer}>
              <Text style={styles.cardSubtitle}>Look directly at the camera to log in</Text>

              {permission?.granted ? (
                <View style={styles.cameraWrapper}>
                  <CameraView ref={cameraRef} style={styles.camera} facing="front">
                    <View style={styles.faceOval} />
                  </CameraView>
                </View>
              ) : (
                <View style={styles.noPermBox}>
                  <Ionicons name="camera-outline" size={40} color="#64748b" />
                  <Text style={styles.noPermText}>Camera permission is needed for face scan</Text>
                  <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permBtnText}>Allow Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.loginBtn, (!permission?.granted || loading) && styles.loginBtnDisabled]}
                onPress={handleFaceLogin}
                disabled={!permission?.granted || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Scan Face to Log In  →</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowEnrollModal(true)} style={styles.enrollLink}>
                <Text style={styles.enrollText}>First time? Tap here to register your face</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ─── ID NUMBER TAB ───────────────────────────────────────── */
            <View style={styles.idTabContainer}>
              <Text style={styles.cardSubtitle}>Enter your Registration Number to continue</Text>

              <View style={styles.inputGroup}>
                <Ionicons name="id-card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. PAT-2026-050"
                  placeholderTextColor="#cbd5e1"
                  value={regNumber}
                  onChangeText={t => { setRegNumber(t); setError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleIdLogin}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleIdLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Login with ID  →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Connection info */}
          <View style={styles.infoBox}>
            <Ionicons name="server-outline" size={14} color="#94a3b8" />
            <Text style={styles.infoText}>Connecting to: {BASE_URL}</Text>
          </View>
        </View>

        {/* Bottom hint */}
        <Text style={styles.hint}>
          Only registered patients can access this system.{'\n'}Contact your caregiver if you need help.
        </Text>

        {/* Enroll Face Modal */}
        <Modal visible={showEnrollModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Register Your Face</Text>
              <Text style={styles.modalSub}>
                Enter your Registration Number and look at the camera. We will register your face for fast login.
              </Text>

              <View style={styles.inputGroup}>
                <Ionicons name="keypad-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. PAT-2026-050"
                  placeholderTextColor="#cbd5e1"
                  value={enrollCode}
                  onChangeText={setEnrollCode}
                  autoCapitalize="characters"
                />
              </View>

              {permission?.granted ? (
                <View style={styles.cameraWrapperSmall}>
                  <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEnrollModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, enrolling && styles.loginBtnDisabled]}
                  onPress={handleEnrollFace}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>Register Face</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#3b82f6', alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
    shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10
  },
  appName: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },

  card: {
    backgroundColor: '#1e293b', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 16,
    padding: 4, marginBottom: 20
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, gap: 6
  },
  tabBtnActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#94a3b8', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  faceTabContainer: { width: '100%' },
  idTabContainer: { width: '100%' },
  cardSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 16, textAlign: 'center' },

  cameraWrapper: {
    width: '100%', height: 260, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#0f172a', marginBottom: 16, borderWidth: 2, borderColor: '#334155'
  },
  cameraWrapperSmall: {
    width: '100%', height: 180, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#0f172a', marginVertical: 12, borderWidth: 1.5, borderColor: '#334155'
  },
  camera: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceOval: {
    width: 140, height: 180, borderRadius: 70,
    borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.7)',
    backgroundColor: 'transparent'
  },

  noPermBox: {
    height: 200, borderRadius: 20, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10, marginBottom: 16
  },
  noPermText: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  permBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#334155', marginBottom: 16, paddingHorizontal: 16
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#f1f5f9', fontWeight: '700', letterSpacing: 1 },

  errorBox: {
    backgroundColor: '#450a0a', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#7f1d1d'
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', lineHeight: 20 },

  loginBtn: {
    backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6
  },
  loginBtnDisabled: { backgroundColor: '#1e40af', opacity: 0.7 },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  enrollLink: { alignItems: 'center', paddingVertical: 8 },
  enrollText: { color: '#60a5fa', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 },
  infoText: { color: '#475569', fontSize: 11, fontWeight: '500' },

  hint: { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24 },
  modalTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  modalSub: { color: '#64748b', fontSize: 13, marginBottom: 16, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#334155', alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900' }
});
