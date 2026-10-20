import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { FamilyShadow } from '../../../constants/familyTheme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

// shared header shell — replaces the identical copy-pasted block that used
// to live in alerts.tsx, calendar.tsx, stories.tsx, patient.tsx, more.tsx,
// and event/[id].tsx. DashboardHeader.tsx keeps its own component (greeting
// + icon buttons + status dot is a materially different layout) but reuses
// FamilyShadow.header internally too.
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, rightSlot }) => (
  <View
    style={{
      backgroundColor: Colors.white,
      paddingTop: 56,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      ...FamilyShadow.header,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.textPrimary }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {rightSlot}
    </View>
  </View>
);
