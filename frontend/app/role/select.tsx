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