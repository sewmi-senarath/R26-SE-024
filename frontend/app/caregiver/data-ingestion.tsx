import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, FlatList } from 'react-native';
import CaregiverSidebar from '../../src/life-logging-memory-vault/components/CaregiverSidebar';
import StatsCard from '../../src/life-logging-memory-vault/components/StatsCard';
import BulkUploadPortal from '../../src/life-logging-memory-vault/components/BulkUploadPortal';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

const IngestionHistory = [
  { id: '1', filename: 'Q3_Behavioral_Logs.csv', size: '2.4 MB', date: 'Oct 24, 2024', status: 'Completed' },
  { id: '2', filename: 'SmartGlass_Raw_Data_Oct.xlsx', size: '840 KB', date: 'Oct 22, 2024', status: 'Completed' },
  { id: '3', filename: 'Home_Activity_Tracker_V2.csv', size: '1.1 MB', date: 'Oct 20, 2024', status: 'Error' },
  { id: '4', filename: 'Patient_Routine_Manual_Entry.csv', size: '12 KB', date: 'Oct 15, 2024', status: 'Completed' },
];

export default function DataIngestionPage() {
  const isWeb = Platform.OS === 'web';

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Bulk Upload & AI Ingestion</Text>
        <Text style={styles.subtitle}>Synchronize external dataset logs with the EchoCare neural network to refine patient behavior patterns.</Text>
      </View>
      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>Latest DB Version: v2.4.1</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb && <CaregiverSidebar />}
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          {renderHeader()}

          <BulkUploadPortal />

          <View style={styles.statsGrid}>
            <StatsCard label="Processed Nodes" value="1.2M+" tag="+14% this month" icon="layers" color={Colors.sageGreen} />
            <StatsCard label="AI Confidence" value="98.2%" icon="checkmark-done" color={Colors.sageGreen} />
            <StatsCard label="Daily Ingestion" value="42.8 GB" icon="flash" color={Colors.sageGreen} />
            <StatsCard label="Neural Pathways" value="14,204" tag="Optimal" icon="git-branch" color={Colors.sageGreen} />
          </View>

          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent Ingestion History</Text>
              <Text style={styles.exportLink}>Export Audit Log <Ionicons name="arrow-forward" size={14} /></Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 3 }]}>Filename</Text>
              <Text style={[styles.columnHeader, { flex: 1 }]}>Size</Text>
              <Text style={[styles.columnHeader, { flex: 2 }]}>Date Uploaded</Text>
              <Text style={[styles.columnHeader, { flex: 1.5 }]}>Status</Text>
              <Text style={[styles.columnHeader, { flex: 1 }]}>Actions</Text>
            </View>

            {IngestionHistory.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                  <Text style={styles.filename}>{item.filename}</Text>
                </View>
                <Text style={[styles.cell, { flex: 1 }]}>{item.size}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{item.date}</Text>
                <View style={[styles.cell, { flex: 1.5 }]}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Completed' ? '#F0FDF4' : '#FEF2F2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Completed' ? '#22C55E' : '#EF4444' }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={[styles.cell, { flex: 1, color: Colors.sageGreen, fontWeight: '600' }]}>View Details</Text>
              </View>
            ))}
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
    padding: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    maxWidth: 600,
  },
  versionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 30,
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  exportLink: {
    fontSize: 14,
    color: Colors.sageGreen,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    alignItems: 'center',
  },
  cell: {
    fontSize: 14,
    color: '#475569',
  },
  filename: {
    fontWeight: '600',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  }
});
