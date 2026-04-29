import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function RoleSelectScreen() {
  const router = useRouter();

  const roles = [
    { id: 'patient', title: 'I am a Patient', sub: 'I need help with my daily routine', icon: 'heart', color: '#E11D48' },
    { id: 'caregiver', title: 'I am a Caregiver', sub: 'I manage care for others', icon: 'shield-checkmark', color: '#2563EB' },
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
              onPress={() => router.push(role.id === 'caregiver' ? '/auth/login' : '/patient')}
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  logoTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  roleList: {
    width: '100%',
    gap: 15,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    marginTop: 100,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '700',
  }
});