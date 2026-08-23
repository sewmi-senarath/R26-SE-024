import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image } from 'react-native';
import CaregiverSidebar from '../../src/life-logging-memory-vault/components/CaregiverSidebar';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function HardwareHubPage() {
  const isWeb = Platform.OS === 'web';

  const VitalRow = ({ label, value, progress, icon, color }: any) => (
    <View style={styles.vitalRow}>
      <View style={[styles.vitalIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <View style={styles.vitalHeader}>
          <Text style={styles.vitalLabel}>{label}</Text>
          <Text style={styles.vitalValue}>{value}</Text>
        </View>
        <View style={styles.vitalBarBg}>
          <View style={[styles.vitalBar, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb && <CaregiverSidebar />}
      
      <ScrollView style={styles.mainContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Hardware Sync Hub</Text>
              <Text style={styles.subtitle}>Manage and monitor EchoCare Smart Glass connectivity and health.</Text>
            </View>
            <View style={styles.headerActions}>
               <TouchableOpacity style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={18} color="#475569" />
                  <Text style={styles.refreshBtnText}>Force Refresh</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.settingsBtn}>
                  <Ionicons name="settings" size={18} color="#fff" />
                  <Text style={styles.settingsBtnText}>Device Settings</Text>
               </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainGrid}>
             {/* Left Column: Visual Status */}
             <View style={styles.visualStatusCard}>
                <View style={styles.syncBadge}>
                   <View style={styles.pulseDot} />
                   <Text style={styles.syncText}>SYNC ACTIVE</Text>
                </View>
                
                <View style={styles.glassesGraphicContainer}>
                   <View style={styles.glassesCircle}>
                      <Ionicons name="glasses" size={100} color={Colors.sageGreen} />
                   </View>
                   <View style={styles.wave1} />
                   <View style={styles.wave2} />
                </View>

                <View style={styles.securityBadge}>
                   <Ionicons name="shield-checkmark" size={14} color={Colors.sageGreen} />
                   <Text style={styles.securityText}>ENCRYPTED CONNECTION SECURE</Text>
                </View>

                <Text style={styles.deviceName}>EchoCare V3 Pro</Text>
                <Text style={styles.deviceDesc}>Device is currently transmitting AR environmental data to the caregiver portal with 4ms latency.</Text>
             </View>

             {/* Right Column: Vitals */}
             <View style={styles.vitalsContainer}>
                <View style={styles.vitalsCard}>
                   <View style={styles.vitalsHeader}>
                      <Text style={styles.vitalsTitle}>System Vitals</Text>
                      <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
                   </View>
                   
                   <VitalRow label="Processor Load" value="24%" progress={24} icon="cpu" color={Colors.sageGreen} />
                   <VitalRow label="Memory Usage" value="1.2 GB / 4 GB" progress={30} icon="layers" color={Colors.primary} />
                   <VitalRow label="Latency (Ping)" value="42 ms" progress={15} icon="timer" color={Colors.warning} />
                </View>

                <View style={styles.alertCard}>
                   <View style={styles.alertIconBox}>
                      <Ionicons name="notifications" size={24} color="#EF4444" />
                   </View>
                   <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.alertTitle}>Maintenance Required</Text>
                      <Text style={styles.alertText}>The left lens sensor reports minor smudge interference. Please advise patient to clean lenses with a microfiber cloth.</Text>
                   </View>
                </View>
             </View>
          </View>

          <View style={styles.connectivityGrid}>
             <View style={styles.connCard}>
                <View style={styles.connHeader}>
                   <Ionicons name="wifi" size={20} color={Colors.sageGreen} />
                   <View style={styles.liveBadge}><Text style={styles.liveText}>Live</Text></View>
                </View>
                <Text style={styles.connLabel}>Smart Glass Connection</Text>
                <Text style={styles.connValue}>Connected <Text style={styles.connSub}>Strong (5GHz)</Text></Text>
             </View>

             <View style={styles.connCard}>
                <View style={styles.connHeader}>
                   <Ionicons name="battery-charging" size={20} color={Colors.warning} />
                   <View style={styles.liveBadge}><Text style={styles.liveText}>Live</Text></View>
                </View>
                <Text style={styles.connLabel}>Device Battery</Text>
                <Text style={styles.connValue}>65% <Text style={styles.connSub}>Charging...</Text></Text>
                <View style={styles.batteryBarBg}>
                   <View style={[styles.batteryBar, { width: '65%' }]} />
                </View>
             </View>

             <View style={styles.connCard}>
                <View style={styles.connHeader}>
                   <Ionicons name="bluetooth" size={20} color={Colors.primary} />
                   <View style={styles.liveBadge}><Text style={styles.liveText}>Live</Text></View>
                </View>
                <Text style={styles.connLabel}>Earphone Status</Text>
                <Text style={styles.connValue}>Active <Text style={styles.connSub}>Bone-Conduction</Text></Text>
             </View>
          </View>

          <View style={styles.firmwareBanner}>
             <View style={styles.firmwareIconBox}>
                <Ionicons name="download" size={24} color={Colors.sageGreen} />
             </View>
             <View style={{ flex: 1, marginLeft: 20 }}>
                <Text style={styles.firmwareTitle}>Firmware v2.4.1 Available</Text>
                <Text style={styles.firmwareText}>Improved AR depth perception and extended battery life through optimized Bluetooth Low Energy (BLE) protocols.</Text>
             </View>
             <TouchableOpacity style={styles.updateBtn}>
                <Text style={styles.updateBtnText}>Update Now</Text>
                <Text style={styles.updateTime}>EST. TIME: 4 MINUTES</Text>
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
    marginBottom: 8,
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
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshBtnText: {
    fontFamily: 'Inter',
    color: '#475569',
    fontWeight: '700',
    marginLeft: 8,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 25,
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  visualStatusCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sageGreen,
    marginRight: 8,
  },
  syncText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  glassesGraphicContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  glassesCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.sageGreen + '20',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  wave1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: Colors.sageGreen + '15',
  },
  wave2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: Colors.sageGreen + '05',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen + '10',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  securityText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.sageGreen,
    marginLeft: 8,
  },
  deviceName: {
    fontFamily: 'Open Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  deviceDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 350,
  },
  vitalsContainer: {
    flex: 1,
    minWidth: 320,
    gap: 25,
  },
  vitalsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    flex: 1,
  },
  vitalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  vitalsTitle: {
    fontFamily: 'Open Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  vitalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  vitalValue: {
    fontFamily: 'Roboto',
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  vitalBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  vitalBar: {
    height: '100%',
    borderRadius: 4,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
  },
  alertIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    flexShrink: 0,
  },
  alertTitle: {
    fontFamily: 'Open Sans',
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 4,
  },
  alertText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 20,
  },
  connectivityGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  connCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.02,
  },
  connHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    backgroundColor: Colors.sageGreenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '800',
    color: Colors.sageGreen,
  },
  connLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 8,
  },
  connValue: {
    fontFamily: 'Open Sans',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  connSub: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  batteryBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginTop: 15,
  },
  batteryBar: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  firmwareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreenSoft,
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: Colors.sageGreen + '20',
    flexWrap: 'wrap',
    gap: 20,
  },
  firmwareIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  firmwareTitle: {
    fontFamily: 'Open Sans',
    fontSize: 18,
    fontWeight: '800',
    color: '#365314',
    marginBottom: 4,
  },
  firmwareText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#4D7C0F',
    lineHeight: 22,
    maxWidth: 600,
  },
  updateBtn: {
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
    flexShrink: 0,
  },
  updateBtnText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  updateTime: {
    fontFamily: 'Roboto',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  }
});
