import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { PatientDetail } from '../../../types/caregiver.types';
import { RoutineItem } from './RoutineItem';

interface PatientExpandedDetailProps {
  patient: PatientDetail;
  onAddRoutine: () => void;
  onRoutineToggle: (routineId: string) => void;
}

export const PatientExpandedDetail: React.FC<PatientExpandedDetailProps> = ({
  patient,
  onAddRoutine,
  onRoutineToggle,
}) => {
  return (
    <View
      className="mx-5 mb-3 rounded-b-3xl px-4 pt-1 pb-4"
      style={{
        backgroundColor: Colors.primaryLight,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: Colors.border,
      }}
    >
      {/* Condition & Notes */}
      <View className="mb-4">
        <Text
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: Colors.textMuted }}
        >
          Condition &amp; Notes
        </Text>
        <Text
          className="text-sm font-bold mb-1"
          style={{ color: Colors.textPrimary }}
        >
          {patient.condition_notes}
        </Text>
        <Text className="text-xs leading-5" style={{ color: Colors.textSecondary }}>
          {patient.condition_description}
        </Text>
      </View>

      {/* Dementia Risk Screening */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/caregiver/dementia-screening',
            params: {
              patientId: patient.id,
              patientName: patient.name,
              patientAge: String(patient.age ?? ''),
            },
          } as any)
        }
        className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
        style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border }}
      >
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <Ionicons name="analytics-outline" size={16} color="#D97706" />
        </View>
        <Text className="text-xs font-semibold flex-1" style={{ color: Colors.textPrimary }}>
          Dementia Risk Screening
        </Text>
        <Text className="text-[11px]" style={{ color: Colors.textMuted }}>
          No test needed
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Divider */}
      <View
        className="mb-4"
        style={{ height: 1, backgroundColor: Colors.border }}
      />

      {/* Daily Routines */}
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: Colors.textMuted }}
        >
          Daily Routines
        </Text>
        <TouchableOpacity
          onPress={onAddRoutine}
          className="flex-row items-center gap-1 px-3 py-1 rounded-full"
          style={{ backgroundColor: Colors.primary }}
        >
          <Ionicons name="add" size={13} color={Colors.white} />
          <Text className="text-xs font-semibold" style={{ color: Colors.white }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {patient.routines.map((routine) => (
        <RoutineItem
          key={routine.id}
          routine={routine}
          onToggle={onRoutineToggle}
        />
      ))}
    </View>
  );
};