import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badge?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name, color, size, badge
}) => (
  <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={size} color={color} />
    {badge && badge > 0 ? (
      <View style={{
        position: 'absolute',
        top: -2, right: -2,
        backgroundColor: Colors.danger,
        borderRadius: 8,
        minWidth: 16, height: 16,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
      }}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    ) : null}
  </View>
);