import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { CareUpdate, UpdateSeverity } from '../../../types/family.types';

interface RecentActivityProps {
  updates: CareUpdate[];
  onViewAll: () => void;
}

const severityConfig: Record<UpdateSeverity, { color: string; bg: string; label: string }> = {
  positive: { color: Colors.success, bg: Colors.successSoft, label: 'Positive' },
  info:     { color: Colors.primary, bg: Colors.primaryLight, label: 'Info' },
  warning:  { color: Colors.warning, bg: Colors.warningSoft, label: 'Attention' },
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ updates, onViewAll }) => (
  <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 8 }}>
    {/* Header */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 }}>
        RECENT CARE ACTIVITY
      </Text>
      <TouchableOpacity onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>View all</Text>
        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
      </TouchableOpacity>
    </View>

    {/* Activity list */}
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: Colors.borderLight,
      }}
    >
      {updates.map((update, index) => {
        const sev = severityConfig[update.severity];
        return (
          <View key={update.id}>
            {index > 0 && (
              <View style={{ height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 }} />
            )}
            <View style={{ flexDirection: 'row', padding: 14, alignItems: 'flex-start' }}>
              {/* Icon */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: sev.bg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                  flexShrink: 0,
                }}
              >
                <Ionicons name={update.icon as keyof typeof Ionicons.glyphMap} size={18} color={sev.color} />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flex: 1 }}>
                    {update.title}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      backgroundColor: sev.bg,
                      marginLeft: 6,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: sev.color }}>{sev.label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginBottom: 4 }}>
                  {update.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="person-outline" size={11} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>{update.caregiverName}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>{update.time}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  </View>
);
