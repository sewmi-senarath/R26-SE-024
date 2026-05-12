import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import CaregiverSidebar from '../../src/life-logging-memory-vault/components/CaregiverSidebar';
import StatsCard from '../../src/life-logging-memory-vault/components/StatsCard';
import BehaviorPatternCard from '../../src/life-logging-memory-vault/components/BehaviorPatternCard';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

const Patterns = [
  { id: '1', title: 'Morning tea in Kitchen', time: 'Today, 8:15 AM', description: 'Patient successfully prepared and consumed tea. Routine matches historical data within 5-minute variance.', confidence: 98, type: 'Nutrition', isAnomaly: false, hasClip: true },
  { id: '2', title: 'Repeated Cabinet Interaction', time: 'Today, 2:45 AM', description: 'Patient opened and closed the medicine cabinet 4 times in 10 minutes without taking medication.', confidence: 85, type: 'Safety', isAnomaly: true, hasClip: true },
  { id: '3', title: 'Daily Garden Walk', time: 'Yesterday, 4:30 PM', description: 'Standard 15-minute walk around the perimeter. Pace and gait appear steady.', confidence: 92, type: 'Activity', isAnomaly: false, hasClip: false },
  { id: '4', title: 'Missed Lunch Window', time: 'Yesterday, 1:45 PM', description: 'Patient did not enter the kitchen during the expected 12:00 PM - 1:30 PM mealtime window.', confidence: 78, type: 'Nutrition', isAnomaly: true, hasClip: false },
  { id: '5', title: 'Evening Bathroom Routine', time: 'Oct 24, 9:00 PM', description: 'Completed oral hygiene and hand washing. Water usage sensors aligned with activity.', confidence: 95, type: 'Hygiene', isAnomaly: false, hasClip: true },
];

export default function BehavioralPatternsPage() {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {isWeb && <CaregiverSidebar />}
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Behavioral Patterns</Text>
              <Text style={styles.subtitle}>AI-detected routines and anomalies for <Text style={{ color: Colors.sageGreen, fontWeight: '700' }}>Maduranga</Text></Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.dateBtn}>
                <Ionicons name="calendar-outline" size={18} color="#475569" />
                <Text style={styles.dateBtnText}>Select Date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.syncBtn}>
                <Ionicons name="cloud-download" size={18} color="#fff" />
                <Text style={styles.syncBtnText}>Manual Sync</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatsCard label="Routines Confirmed" value="24" tag="+12% weekly" icon="checkmark-circle" color={Colors.sageGreen} />
            <StatsCard label="Anomalies Detected" value="3" tag="-5% weekly" icon="warning" color={Colors.warning} />
            <StatsCard label="Avg. Confidence" value="91%" icon="analytics" color={Colors.sageGreen} />
            <StatsCard label="Smart Glass Status" value="Online" subValue="Battery 65%" icon="glasses" color={Colors.primary} />
          </View>

          <View style={styles.filterSection}>
             <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, styles.activeTab]}><Text style={[styles.tabText, styles.activeTabText]}>All Logs</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Routines</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tab}><Text style={styles.tabText}>Anomalies</Text></TouchableOpacity>
             </View>
             <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput style={styles.searchInput} placeholder="Search activity..." />
             </View>
          </View>

          <View style={styles.patternsList}>
            {Patterns.map((item) => (
              <BehaviorPatternCard 
                key={item.id}
                title={item.title}
                time={item.time}
                description={item.description}
                confidence={item.confidence}
                type={item.type as any}
                isAnomaly={item.isAnomaly}
                hasClip={item.hasClip}
              />
            ))}
            
            <TouchableOpacity style={styles.loadMoreBtn}>
               <Text style={styles.loadMoreText}>Load Historical Records</Text>
            </TouchableOpacity>
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
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dateBtnText: {
    fontFamily: 'Inter',
    color: '#475569',
    fontWeight: '700',
    marginLeft: 8,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  syncBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontWeight: '800',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 14,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: Colors.sageGreen,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
  },
  searchInput: {
    fontFamily: 'Inter',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  patternsList: {
    marginBottom: 40,
    gap: 16,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  loadMoreText: {
    fontFamily: 'Inter',
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  }
});
