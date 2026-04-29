import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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
    padding: 16,
    width: '48%', // For 2-column layout on web
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  location: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  healthBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  healthBar: {
    height: '100%',
    borderRadius: 2,
  },
  mapContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 120,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapHeader: {
    padding: 8,
    backgroundColor: '#F1F5F9',
  },
  mapTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beaconPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sageGreen,
    borderWidth: 2,
    borderColor: '#fff',
    left: '50%',
    top: '50%',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  pingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sageGreen,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  historyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  }
});

export default TrackedObjectCard;
