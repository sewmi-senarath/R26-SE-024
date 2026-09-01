import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
  const isLinked = !!patient.registeredPatientId;

  const handleViewProfile = () => {
    if (!patient.registeredPatientId) return;
    router.push({
      pathname: '/caregiver/patient-report',
      params: { patientId: patient.registeredPatientId, patientName: patient.name },
    } as any);
  };

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
      {/* Cognitive profile & AI triage check */}
      <View className="mb-4">
        <Text
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: Colors.textMuted }}
        >
          Cognitive Profile
        </Text>
        {isLinked ? (
          <TouchableOpacity
            onPress={handleViewProfile}
            className="flex-row items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ backgroundColor: Colors.primary }}
          >
            <Ionicons name="pulse-outline" size={16} color={Colors.white} />
            <Text className="text-sm font-bold" style={{ color: Colors.white }}>
              View Profile &amp; AI Triage Check
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            className="flex-row items-start gap-2 p-3 rounded-2xl"
            style={{ backgroundColor: '#FFFBEB' }}
          >
            <Ionicons name="information-circle-outline" size={15} color="#D97706" />
            <Text className="text-xs flex-1" style={{ color: '#B45309' }}>
              {patient.name} isn&apos;t linked to a registered patient account yet, so
              there&apos;s no cognitive data to show. Link an account when editing the patient.
            </Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View
        className="mb-4"
        style={{ height: 1, backgroundColor: Colors.border }}
      />

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