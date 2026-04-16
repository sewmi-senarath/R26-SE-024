import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/colors';
import { CaregiverProfile } from '../../../../types/caregiver.types';

interface ProfileCardProps {
  profile: CaregiverProfile & { profileImage?: string };
  onEditPress: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEditPress }) => {
  return (
    <View style={{
      marginHorizontal: 20, marginBottom: 20,
      borderRadius: 24, overflow: 'hidden',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 16, elevation: 5,
    }}>
      {/* Blue top band */}
      <View style={{
        backgroundColor: Colors.primary,
        paddingTop: 20, paddingBottom: 36, paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: '#ffffff90',
            textTransform: 'uppercase', letterSpacing: 1.5,
          }}>
            My Profile
          </Text>
          <TouchableOpacity
            onPress={onEditPress}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: '#ffffff20',
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
            }}
          >
            <Ionicons name="pencil-outline" size={12} color="#fff" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* White bottom section */}
      <View style={{
        backgroundColor: Colors.white,
        paddingHorizontal: 20, paddingBottom: 20, paddingTop: 0,
      }}>
        {/* Avatar overlapping blue band */}
        <View style={{ alignItems: 'flex-start', marginTop: -32 }}>
          <View style={{ position: 'relative' }}>
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  borderWidth: 3, borderColor: Colors.white,
                }}
              />
            ) : (
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: Colors.white,
              }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.primary }}>
                  {profile.initials}
                </Text>
              </View>
            )}

            {/* Online dot */}
            {profile.isOnline && (
              <View style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: 7,
                backgroundColor: Colors.success,
                borderWidth: 2.5, borderColor: Colors.white,
              }} />
            )}
          </View>
        </View>

        {/* Name + role + email */}
        <View style={{ marginTop: 10, marginBottom: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
            {profile.name}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 }}>
            {profile.role}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="mail-outline" size={12} color={Colors.textMuted} />
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>{profile.email}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: Colors.borderLight, marginBottom: 14 }} />

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            { value: profile.shiftsCompleted,  label: 'Shifts',   color: Colors.primary  },
            { value: profile.patientsAssigned, label: 'Patients', color: '#8B5CF6'       },
            { value: profile.hoursThisWeek,    label: 'Hrs/week', color: Colors.success  },
          ].map((stat) => (
            <View key={stat.label} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: stat.color }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '500', marginTop: 2 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};