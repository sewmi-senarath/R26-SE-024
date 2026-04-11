import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { PatientDetail } from '../../../types/caregiver.types';
import { PatientExpandedDetail } from './PatientExpandedDetail';

const conditionConfig = {
  Moderate: { color: Colors.warning,  bg: Colors.warningSoft  },
  Mild:     { color: Colors.success,  bg: Colors.successSoft  },
  Critical: { color: Colors.danger,   bg: Colors.dangerSoft   },
  Stable:   { color: Colors.primary,  bg: Colors.primaryLight },
};

const avatarColors = [
  '#4F8EF7', '#22C55E', '#F97316',
  '#8B5CF6', '#EF4444', '#06B6D4',
];

interface PatientListItemProps {
  patient: PatientDetail;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRoutineToggle: (patientId: string, routineId: string) => void;
  onAddRoutine: (patientId: string) => void;
  index: number;
}

export const PatientListItem: React.FC<PatientListItemProps> = ({
  patient,
  isExpanded,
  onToggleExpand,
  onRoutineToggle,
  onAddRoutine,
  index,
}) => {
  const config = conditionConfig[patient.condition] ?? conditionConfig.Stable;
  const avatarColor = avatarColors[index % avatarColors.length];

  return (
    <View className="mb-1">
      {/* ── Patient Row ── */}
      <TouchableOpacity
        onPress={() => onToggleExpand(patient.id)}
        activeOpacity={0.85}
        style={{
          backgroundColor: Colors.white,
          marginHorizontal: 20,
          borderRadius: isExpanded ? 0 : 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: isExpanded ? 0 : 20,
          borderBottomRightRadius: isExpanded ? 0 : 20,
          borderWidth: 1,
          borderColor: isExpanded ? Colors.primary : Colors.borderLight,
          borderBottomWidth: isExpanded ? 0 : 1,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#4F8EF7',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isExpanded ? 0.1 : 0.04,
          shadowRadius: 8,
          elevation: isExpanded ? 3 : 1,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: avatarColor + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            borderWidth: 1.5,
            borderColor: avatarColor + '40',
          }}
        >
          <Text style={{ color: avatarColor, fontWeight: '800', fontSize: 14 }}>
            {patient.initials}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 14 }}
            numberOfLines={1}
          >
            {patient.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
              {patient.age} yrs
            </Text>
            <View
              style={{
                width: 3, height: 3, borderRadius: 2,
                backgroundColor: Colors.textMuted,
              }}
            />
            <View
              style={{
                paddingHorizontal: 8, paddingVertical: 2,
                borderRadius: 20,
                backgroundColor: config.bg,
              }}
            >
              <Text style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>
                {patient.condition}
              </Text>
            </View>
            <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
              {patient.stage} Stage
            </Text>
          </View>
        </View>

        {/* Expand toggle */}
        <View
          style={{
            width: 30, height: 30, borderRadius: 15,
            borderWidth: 1.5,
            borderColor: isExpanded ? Colors.primary : Colors.border,
            backgroundColor: isExpanded ? Colors.primaryLight : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={isExpanded ? Colors.primary : Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded Detail ── */}
      {isExpanded && (
        <PatientExpandedDetail
          patient={patient}
          onAddRoutine={() => onAddRoutine(patient.id)}
          onRoutineToggle={(routineId) => onRoutineToggle(patient.id, routineId)}
        />
      )}
    </View>
  );
};