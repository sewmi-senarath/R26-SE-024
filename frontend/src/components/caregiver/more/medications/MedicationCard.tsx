import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/colors';
import { Medication } from '../../../../types/caregiver.types';

const statusConfig = {
  taken:   { color: Colors.success, bg: Colors.successSoft, icon: 'checkmark-circle' as const,  label: 'taken'    },
  pending: { color: Colors.warning, bg: Colors.warningSoft, icon: 'time-outline' as const,       label: 'pending'  },
  missed:  { color: Colors.danger,  bg: Colors.dangerSoft,  icon: 'close-circle' as const,       label: 'missed'   },
};

interface MedicationCardProps {
  medication: Medication;
  onToggleStatus: (id: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication: med, onToggleStatus,
}) => {
  const cfg = statusConfig[med.status];

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 10,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderLeftWidth: 4,
        borderLeftColor: cfg.color,
        shadowColor: cfg.color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {/* Icon */}
        <View
          style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: cfg.bg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="medical-outline" size={20} color={cfg.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.textPrimary }}>
              {med.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textMuted }}>
              {med.time}
            </Text>
          </View>

          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
            {med.dose} • {med.form}
          </Text>

          {/* Patient */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <View
              style={{
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: med.patientColor + '22',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: '800', color: med.patientColor }}>
                {med.patientInitials}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: '500' }}>
              {med.patientName}
            </Text>
          </View>

          {/* Bottom row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => onToggleStatus(med.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 12, paddingVertical: 5,
                borderRadius: 10, backgroundColor: cfg.bg,
              }}
            >
              <Ionicons name={cfg.icon} size={14} color={cfg.color} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>
                {cfg.label}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flame-outline" size={13} color={
                med.streak > 10 ? Colors.success : Colors.warning
              } />
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted }}>
                {med.streak} day streak
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};