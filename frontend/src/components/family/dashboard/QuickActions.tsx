import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { FamilyRadius, FamilyShadow } from '../../../constants/familyTheme';
import { IconChip } from '../ui/IconChip';

interface QuickActionsProps {
  onStoriesPress: () => void;
  onCalendarPress: () => void;
  calendarBadge?: number;
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  badge?: number;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon, label, color, bgColor, onPress, badge,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flex: 1,
      backgroundColor: Colors.white,
      borderRadius: FamilyRadius.md,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.borderLight,
      ...FamilyShadow.card,
    }}
  >
    <View style={{ position: 'relative' }}>
      <View style={{ marginBottom: 8 }}>
        <IconChip icon={icon} color={color} bg={bgColor} size={48} iconSize={24} radius={FamilyRadius.sm} />
      </View>
      {badge && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: Colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: Colors.white,
          }}
        >
          <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const QuickActions: React.FC<QuickActionsProps> = ({
  onStoriesPress, onCalendarPress, calendarBadge,
}) => (
  <View style={{ marginHorizontal: 20, marginTop: 20 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>
      QUICK ACTIONS
    </Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <ActionButton
        icon="mic"
        label="Memory Stories"
        color={Colors.purple}
        bgColor={Colors.purpleSoft}
        onPress={onStoriesPress}
      />
      <ActionButton
        icon="calendar"
        label="Calendar"
        color={Colors.success}
        bgColor={Colors.successSoft}
        onPress={onCalendarPress}
        badge={calendarBadge}
      />
    </View>
  </View>
);
