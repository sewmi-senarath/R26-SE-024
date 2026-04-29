import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';

interface BehaviorPatternCardProps {
  title: string;
  time: string;
  description: string;
  confidence: number;
  type: 'Nutrition' | 'Activity' | 'Safety' | 'Hygiene';
  isAnomaly?: boolean;
  hasClip?: boolean;
}

const BehaviorPatternCard: React.FC<BehaviorPatternCardProps> = ({ 
  title, time, description, confidence, type, isAnomaly, hasClip 
}) => {
  const iconColor = isAnomaly ? Colors.warning : Colors.sageGreen;
  const bgColor = isAnomaly ? Colors.warningSoft : Colors.sageGreenSoft;

  return (
    <View style={styles.card}>
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <Ionicons 
                name={isAnomaly ? 'warning' : 'checkmark-circle'} 
                size={20} 
                color={iconColor} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.time}><Ionicons name="calendar-outline" size={12} /> {time}</Text>
            </View>
          </View>
          <View style={styles.confidenceSection}>
             <Text style={styles.confidenceLabel}>AI CONFIDENCE</Text>
             <Text style={[styles.confidenceValue, { color: iconColor }]}>{confidence}%</Text>
             <View style={styles.progressBarBg}>
               <View style={[styles.progressBar, { width: `${confidence}%`, backgroundColor: iconColor }]} />
             </View>
          </View>
        </View>
        
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.type}>{type}</Text>
          {hasClip && (
            <TouchableOpacity style={styles.viewFeedBtn}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.viewFeedText}>View Feed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftBorder: {
    width: 6,
    backgroundColor: Colors.sageGreen,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  confidenceSection: {
    alignItems: 'flex-end',
    width: 100,
  },
  confidenceLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  viewFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewFeedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  }
});

export default BehaviorPatternCard;
