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
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  leftBorder: {
    width: 6,
    backgroundColor: Colors.sageGreen,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    flexWrap: 'wrap',
    gap: 15,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Open Sans',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  time: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  confidenceSection: {
    alignItems: 'flex-end',
    width: 110,
    flexShrink: 0,
  },
  confidenceLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  confidenceValue: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  progressBarBg: {
    height: 5,
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  type: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: Colors.sageGreen,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  viewFeedText: {
    fontFamily: 'Inter',
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  }
});

export default BehaviorPatternCard;
