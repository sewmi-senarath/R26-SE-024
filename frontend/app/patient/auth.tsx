import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:5000';
const API = `${BASE_URL}/api/admin/behavior`;

export default function PatientAuthScreen() {
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // ─── Log in with Registration Number ──────────────────────────
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

  const handleError = (err: any) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      setError(`⏱ Connection timed out.\nMake sure the backend is running on ${BASE_URL}`);
    } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
      setError(`📡 Network Error - Cannot reach ${BASE_URL}\n\nCheck WiFi and verify backend is running on port 5000.`);
    } else if (err.response?.status === 404) {
      setError('❌ Patient not registered.\nCheck your Registration Number.');
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
            <Ionicons name="medical" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>MemoCare</Text>
          <Text style={styles.tagline}>Personalized Dementia Care</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
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

  idTabContainer: { width: '100%' },
  cardSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 16, textAlign: 'center' },

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

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 },
  infoText: { color: '#475569', fontSize: 11, fontWeight: '500' },

  hint: { textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
