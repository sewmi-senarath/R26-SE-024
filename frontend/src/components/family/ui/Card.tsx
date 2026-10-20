import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors } from '../../../constants/colors';
import { FamilyRadius, FamilyShadow } from '../../../constants/familyTheme';

interface CardProps {
  children: React.ReactNode;
  tier?: 'card' | 'elevated';
  radius?: keyof typeof FamilyRadius;
  padding?: number;
  style?: ViewStyle;
}

// shared white-surface card — replaces the standard card-shadow recipe
// (shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:3)
// copy-pasted 15+ times across the family module.
export const Card: React.FC<CardProps> = ({ children, tier = 'card', radius = 'lg', padding = 18, style }) => (
  <View
    style={{
      backgroundColor: Colors.white,
      borderRadius: FamilyRadius[radius],
      padding,
      borderWidth: 1,
      borderColor: Colors.borderLight,
      ...FamilyShadow[tier],
      ...style,
    }}
  >
    {children}
  </View>
);
