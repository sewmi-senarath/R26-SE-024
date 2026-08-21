<<<<<<< HEAD
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function RoleSelectScreen() {
  const router = useRouter();

  const roles = [
    { id: 'patient', title: 'I am a Patient', sub: 'Standard login for patients', icon: 'heart', color: '#E11D48' },
    { id: 'patient-face', title: 'Patient Face Login', sub: 'Log in instantly using your face', icon: 'scan-circle-outline', color: '#8B5CF6' },
    { id: 'caregiver', title: 'I am a Caregiver', sub: 'I manage care for others', icon: 'shield-checkmark', color: '#2563EB' },
    { id: 'admin', title: 'I am Admin', sub: 'System administration and management', icon: 'settings', color: Colors.sageGreen },
    { id: 'family', title: 'I am Family', sub: 'I want to stay connected', icon: 'people', color: '#0891B2' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
           <View style={styles.logoCircle}>
              <Ionicons name="heart" size={40} color={Colors.primary} />
              <Text style={styles.logoTextSmall}>MemoCare</Text>
           </View>
           <Text style={styles.tagline}>Connected care for what matters most</Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((role) => (
            <TouchableOpacity 
              key={role.id} 
              style={[styles.roleCard, { borderLeftColor: role.color }]}
              onPress={() => {
                if (role.id === 'caregiver') router.push('/auth/login');
                else if (role.id === 'admin') router.push('/auth/admin-login');
                else if (role.id === 'patient-face') router.push('/patient/auth');
                else if (role.id === 'patient') router.push('/auth/login'); // Or whatever the dev branch uses for patient
                else router.push('/patient');
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: role.color + '15' }]}>
                <Ionicons name={role.icon as any} size={24} color={role.color} />
              </View>
              <View style={styles.roleText}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSub}>{role.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => router.push('/auth/login')}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.loginLink}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 25,
  },
  logoTextSmall: {
    fontFamily: 'Open Sans',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  roleList: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    borderLeftWidth: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Open Sans',
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    marginTop: 80,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '800',
  }
});
=======
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#EFF6FF' }}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 90, height: 90 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1e40af', marginTop: 12 }}>
          Who are you?
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 6, textAlign: 'center', fontSize: 15 }}>
          Select your role to create your account
        </Text>
      </View>

      {/* Patient → /auth/register/patient */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/patient')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          borderLeftWidth: 5, borderLeftColor: '#ec4899',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="heart" size={26} color="#ec4899" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am a Patient</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I need help with my daily routine</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Caregiver → /auth/register/caregiver */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/caregiver')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          borderLeftWidth: 5, borderLeftColor: '#3b82f6',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="shield-checkmark" size={26} color="#3b82f6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am a Caregiver</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I manage care for others</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Family → /auth/register/family */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/family')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 40,
          borderLeftWidth: 5, borderLeftColor: '#06b6d4',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#cffafe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="people" size={26} color="#06b6d4" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am Family</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I want to stay connected</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Login Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Log in</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
>>>>>>> origin/dev
