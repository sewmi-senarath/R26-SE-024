import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Patient } from '../../../types/caregiver.types';

const conditionConfig = {
  Moderate: { color: Colors.warning, bg: Colors.warningSoft },
  Mild: { color: Colors.success, bg: Colors.successSoft },
  Critical: { color: Colors.danger, bg: Colors.dangerSoft },
  Stable: { color: Colors.primary, bg: Colors.primaryLight },
};

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const config = conditionConfig[patient.condition];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-2xl p-4 mr-3 shadow-sm"
      style={{
        backgroundColor: Colors.white,
        width: 140,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
      activeOpacity={0.85}
    >
      {/* Avatar + emoji */}
      <View className="flex-row items-start justify-between mb-3">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center"
          style={{ backgroundColor: patient.avatarColor + '22' }}
        >
          <Text className="font-bold text-base" style={{ color: patient.avatarColor }}>
            {patient.initials}
          </Text>
        </View>
        <Text className="text-lg">{patient.emoji}</Text>
      </View>

      <Text
        className="font-semibold text-sm"
        style={{ color: Colors.textPrimary }}
        numberOfLines={1}
      >
        {patient.name}
      </Text>

      <View
        className="mt-2 px-2 py-0.5 rounded-full self-start"
        style={{ backgroundColor: config.bg }}
      >
        <Text className="text-xs font-medium" style={{ color: config.color }}>
          {patient.condition}
        </Text>
      </View>

      <Text className="text-xs mt-2" style={{ color: Colors.textMuted }}>
        {patient.lastChecked}
      </Text>
    </TouchableOpacity>
  );
};

interface PatientOverviewProps {
  patients: Patient[];
  onSeeAllPress?: () => void;
  onPatientPress?: (patient: Patient) => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patients,
  onSeeAllPress,
  onPatientPress,
}) => {
  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text className="text-base font-bold" style={{ color: Colors.textPrimary }}>
          Patient Overview
        </Text>
        <TouchableOpacity onPress={onSeeAllPress} className="flex-row items-center gap-1">
          <Text className="text-sm font-medium" style={{ color: Colors.primary }}>
            See all
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
      >
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() => onPatientPress?.(patient)}
          />
        ))}
      </ScrollView>
    </View>
  );
};