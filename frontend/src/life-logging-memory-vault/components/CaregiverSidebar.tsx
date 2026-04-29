import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

const CaregiverSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/caregiver' },
    { id: 'behavior', label: 'Behavior Logs', icon: 'time', href: '/caregiver/behavior-logs' },
    { id: 'objects', label: 'Object Tracker', icon: 'search', href: '/caregiver/object-tracker' },
    { id: 'hardware', label: 'Hardware Hub', icon: 'hardware-chip', href: '/caregiver/hardware-hub' },
    { id: 'ingestion', label: 'Data Ingestion', icon: 'cloud-upload', href: '/caregiver/data-ingestion' },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Ionicons name="pulse" size={24} color="#fff" />
        </View>
        <Text style={styles.logoText}>EchoCare</Text>
      </View>

      <ScrollView style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, isActive && styles.activeItem]}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={isActive ? Colors.sageGreen : '#64748B'} 
              />
              <Text style={[styles.menuLabel, isActive && styles.activeLabel]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="settings-outline" size={20} color="#64748B" />
          <Text style={styles.footerLabel}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerItem, { marginTop: 15 }]}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.footerLabel, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingVertical: 30,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 40,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.sageGreen,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginVertical: 4,
  },
  activeItem: {
    backgroundColor: Colors.sageGreen + '08',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 15,
  },
  activeLabel: {
    color: Colors.sageGreen,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    width: 4,
    height: '100%',
    backgroundColor: Colors.sageGreen,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  footer: {
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 15,
  }
});

export default CaregiverSidebar;
