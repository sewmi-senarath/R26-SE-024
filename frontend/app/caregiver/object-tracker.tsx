import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import CaregiverSidebar from '../../src/life-logging-memory-vault/components/CaregiverSidebar';
import TrackedObjectCard from '../../src/life-logging-memory-vault/components/TrackedObjectCard';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

const Objects = [
  { id: '1', name: 'House Keys', location: 'Entry Hallway', lastSeen: '2 mins ago', beaconHealth: 88, status: 'Detected', roomContext: 'Entry Hallway' },
  { id: '2', name: 'Leather Wallet', location: 'Living Room', lastSeen: '14 mins ago', beaconHealth: 42, status: 'Lost Contact', roomContext: 'Living Room' },
  { id: '3', name: 'Hair Brush', location: 'Master Bedroom', lastSeen: 'Just now', beaconHealth: 95, status: 'Detected', roomContext: 'Master Bedroom' },
  { id: '4', name: 'Medication Box', location: 'Kitchen Counter', lastSeen: '1 hour ago', beaconHealth: 12, status: 'Moved', roomContext: 'Kitchen' },
  { id: '5', name: 'Reading Glasses', location: 'Study Desk', lastSeen: '8 mins ago', beaconHealth: 76, status: 'Detected', roomContext: 'Study Desk' },
  { id: '6', name: 'TV Remote', location: 'Living Room', lastSeen: '5 mins ago', beaconHealth: 94, status: 'Detected', roomContext: 'Living Room' },
];

export default function ObjectTrackerPage() {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {isWeb && <CaregiverSidebar />}
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Object Tracker</Text>
              <Text style={styles.subtitle}>Real-time location of essential items via EchoCare AR Glasses.</Text>
            </View>
            <View style={styles.headerStats}>
               <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>TRACKED</Text>
                  <Text style={styles.miniStatValue}>12</Text>
               </View>
               <View style={styles.miniStat}>
                  <Text style={styles.miniStatLabel}>ACTIVE</Text>
                  <Text style={[styles.miniStatValue, { color: Colors.sageGreen }]}>11</Text>
               </View>
               <TouchableOpacity style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={20} color={Colors.sageGreen} />
               </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchBarRow}>
             <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput style={styles.searchInput} placeholder="Search for 'Keys', 'Wallet', or room names..." />
             </View>
             <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="filter" size={18} color="#475569" />
                <Text style={styles.filterBtnText}>Filters</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add New Item</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.statusBanner}>
             <View style={styles.pulseIcon} />
             <Text style={styles.statusText}>
                <Text style={{ fontWeight: '700' }}>Glasses Synchronization Active</Text>{"\n"}
                Using interior mapping data from Maduranga's Smart Glasses. Last sync 12 seconds ago.
             </Text>
             <View style={styles.liveBadge}><Text style={styles.liveText}>Live Feed</Text></View>
          </View>

          <View style={styles.grid}>
             {Objects.map((item) => (
               <TrackedObjectCard 
                 key={item.id}
                 name={item.name}
                 location={item.location}
                 lastSeen={item.lastSeen}
                 beaconHealth={item.beaconHealth}
                 status={item.status as any}
                 roomContext={item.roomContext}
               />
             ))}
          </View>

          <View style={styles.logSection}>
             <View style={styles.logHeader}>
                <Text style={styles.logTitle}>Recent Movement Logs</Text>
                <Text style={styles.viewAll}>View Full Timeline</Text>
             </View>
             <View style={styles.table}>
                <View style={styles.tableHeader}>
                   <Text style={[styles.tableCol, { flex: 2 }]}>OBJECT</Text>
                   <Text style={[styles.tableCol, { flex: 1.5 }]}>ACTION</Text>
                   <Text style={[styles.tableCol, { flex: 2 }]}>LOCATION</Text>
                   <Text style={[styles.tableCol, { flex: 1.5 }]}>TIME</Text>
                </View>
                {Objects.slice(0, 5).map(item => (
                  <View key={item.id} style={styles.tableRow}>
                     <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>{item.name}</Text>
                     <View style={[styles.actionBadge, { backgroundColor: item.status === 'Lost Contact' ? '#FEF2F2' : '#F0FDF4' }]}>
                        <Text style={[styles.actionText, { color: item.status === 'Lost Contact' ? '#EF4444' : '#22C55E' }]}>{item.status}</Text>
                     </View>
                     <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="location" size={14} color={Colors.sageGreen} style={{ marginRight: 5 }} />
                        <Text style={styles.tableCell}>{item.location}</Text>
                     </View>
                     <Text style={[styles.tableCell, { flex: 1.5 }]}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                ))}
             </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  contentWrapper: {
    padding: Platform.OS === 'web' ? 40 : 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
    gap: 20,
  },
  title: {
    fontFamily: 'Open Sans',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    flexWrap: 'wrap',
  },
  miniStat: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  miniStatLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  miniStatValue: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: Colors.sageGreen + '15',
    borderRadius: 10,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 2,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    fontFamily: 'Inter',
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 120,
  },
  filterBtnText: {
    fontFamily: 'Inter',
    color: '#475569',
    fontWeight: '700',
    marginLeft: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 160,
  },
  addBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontWeight: '800',
    marginLeft: 8,
  },
  statusBanner: {
    backgroundColor: Colors.sageGreenSoft,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.sageGreen + '20',
    flexWrap: 'wrap',
    gap: 15,
  },
  pulseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.sageGreen + '30',
    borderWidth: 6,
    borderColor: Colors.sageGreen + '15',
    flexShrink: 0,
  },
  statusText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sageGreen,
    lineHeight: 20,
    minWidth: 250,
  },
  liveBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.sageGreen,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  logSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 15,
    overflow: Platform.OS === 'web' ? 'visible' : 'scroll',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  logTitle: {
    fontFamily: 'Open Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewAll: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.sageGreen,
    fontWeight: '700',
  },
  table: {
    width: '100%',
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCol: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
  },
  tableCell: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#475569',
  },
  actionBadge: {
    flex: 1.5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
  }
});
