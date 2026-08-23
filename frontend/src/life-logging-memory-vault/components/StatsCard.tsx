import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  tag?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, icon, color = Colors.sageGreen, tag }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {tag && <Text style={[styles.tag, { color: color, backgroundColor: color + '10' }]}>{tag}</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {subValue && <Text style={styles.subValue}>{subValue}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    flex: 1,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  value: {
    fontFamily: 'Roboto',
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subValue: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 6,
  }
});

export default StatsCard;
