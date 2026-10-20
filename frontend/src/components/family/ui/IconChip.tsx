import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

interface IconChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  size?: number;
  iconSize?: number;
  radius?: number;
}

// shared "icon in a soft-tint chip" pattern — already de facto formalized
// via iconColor/iconBg props in QuickActions/StatsGrid/more.tsx's Row;
// this is that same pattern pulled out as one reusable primitive.
export const IconChip: React.FC<IconChipProps> = ({ icon, color, bg, size = 42, iconSize, radius = 12 }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.5)} color={color} />
  </View>
);
