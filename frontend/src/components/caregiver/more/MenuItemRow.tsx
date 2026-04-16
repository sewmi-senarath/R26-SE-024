import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { MenuItem } from '../../../types/caregiver.types';

interface MenuItemRowProps {
  item: MenuItem;
  isFirst: boolean;
  isLast: boolean;
  onPress: (item: MenuItem) => void;
}

export const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  isFirst,
  isLast,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97, duration: 80, useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1, duration: 100, useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: Colors.white,
          borderTopLeftRadius: isFirst ? 18 : 0,
          borderTopRightRadius: isFirst ? 18 : 0,
          borderBottomLeftRadius: isLast ? 18 : 0,
          borderBottomRightRadius: isLast ? 18 : 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: Colors.borderLight,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 38, height: 38,
            borderRadius: 12,
            backgroundColor: item.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={item.iconColor}
          />
        </View>

        {/* Label */}
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: '600',
            color: Colors.textPrimary,
          }}
        >
          {item.label}
        </Text>

        {/* Badge */}
        {item.badge && item.badge > 0 ? (
          <View
            style={{
              minWidth: 22, height: 22,
              borderRadius: 11,
              backgroundColor: item.badgeColor ?? Colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 5,
              marginRight: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11, fontWeight: '800',
                color: Colors.white,
              }}
            >
              {item.badge}
            </Text>
          </View>
        ) : null}

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};