import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { LinkedPatient, PatientCondition } from '../../../types/family.types';

interface PatientStatusCardProps {
  patient: LinkedPatient;
  onPress: () => void;
}

const conditionConfig: Record<PatientCondition, { color: string; bg: string }> = {
  Mild:     { color: Colors.success,  bg: Colors.successSoft },
  Moderate: { color: Colors.warning,  bg: Colors.warningSoft },
  Stable:   { color: Colors.primary,  bg: Colors.primaryLight },
  Severe:   { color: Colors.danger,   bg: Colors.dangerSoft },
  Critical: { color: Colors.danger,   bg: Colors.dangerSoft },
};

const moodLabelMap: Record<string, string> = {
  awful:   'Very Low',
  sad:     'Low',
  neutral: 'Neutral',
  happy:   'Good',
  great:   'Great',
};

export const PatientStatusCard: React.FC<PatientStatusCardProps> = ({ patient, onPress }) => {
  const cond = conditionConfig[patient.condition];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 18,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: patient.avatarColor + '22',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: patient.avatarColor,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '800', color: patient.avatarColor }}>
            {patient.initials}
          </Text>
        </View>

        {/* Name & condition */}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textPrimary }}>
            {patient.name}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>
            {patient.stage} · Age {patient.age}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor: cond.bg,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: cond.color }}>
                {patient.condition}
              </Text>
            </View>
          </View>
        </View>

        {/* Mood & arrow */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 30 }}>{patient.moodEmoji}</Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 2 }}>
            {moodLabelMap[patient.currentMood]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 }} />

      {/* 7-day mood strip */}
      <View>
        <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: 8 }}>
          7-DAY MOOD TREND
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {patient.moodHistory.map((mood, i) => {
            const emojiMap: Record<string, string> = {
              awful: '😞', sad: '😔', neutral: '😐', happy: '😊', great: '😄',
            };
            const isToday = i === patient.moodHistory.length - 1;
            return (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: isToday ? 22 : 16 }}>{emojiMap[mood]}</Text>
                {isToday && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: Colors.primary,
                      marginTop: 2,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: Colors.textMuted }}>Mon</Text>
          <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '700' }}>Today</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>
            Updated {patient.lastUpdated}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>View profile</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
