import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

interface TrackedObjectCardProps {
  name: string;
  location: string;
  lastSeen: string;
  beaconHealth: number;
  status: 'Detected' | 'Lost Contact' | 'Moved';
  roomContext: string;
  mapImage?: any; // Floor plan snippet
}

const TrackedObjectCard: React.FC<TrackedObjectCardProps> = ({
  name, location, lastSeen, beaconHealth, status, roomContext, mapImage
}) => {
  const statusColor = status === 'Lost Contact' ? Colors.danger : Colors.sageGreen;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.iconBox, { backgroundColor: Colors.sageGreen + '15' }]}>
            <Ionicons name="key" size={18} color={Colors.sageGreen} />
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.location}><Ionicons name="location-outline" size={10} /> {location}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>LAST SEEN</Text>
          <Text style={styles.statValue}>{lastSeen}</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Text style={styles.statLabel}>BEACON HEALTH</Text>
            <Text style={[styles.statLabel, { color: statusColor }]}>{beaconHealth}%</Text>
          </View>
          <View style={styles.healthBarBg}>
            <View style={[styles.healthBar, { width: `${beaconHealth}%`, backgroundColor: statusColor }]} />
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>{roomContext.toUpperCase()}</Text>
        </View>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={40} color="#E2E8F0" />
          <View style={styles.beaconPulse} />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.pingBtn}>
          <Ionicons name="volume-high" size={16} color="#fff" />
          <Text style={styles.pingText}>Ping Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyBtn}>
          <Ionicons name="time-outline" size={16} color="#475569" />
          <Text style={styles.historyText}>Path History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 300,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  name: {
    fontFamily: 'Open Sans',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  location: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  healthBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: 6,
  },
  healthBar: {
    height: '100%',
    borderRadius: 3,
  },
  mapContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    height: 140,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapHeader: {
    padding: 10,
    backgroundColor: '#F1F5F9',
  },
  mapTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beaconPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.sageGreen,
    borderWidth: 3,
    borderColor: '#fff',
    left: '50%',
    top: '50%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  pingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sageGreen,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.sageGreen,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  pingText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  historyText: {
    fontFamily: 'Inter',
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  }
});

export default TrackedObjectCard;
