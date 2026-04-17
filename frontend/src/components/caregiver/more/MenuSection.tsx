import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { MenuItemRow } from './MenuItemRow';
import { MenuSection as MenuSectionType, MenuItem } from '../../../types/caregiver.types';

interface MenuSectionProps {
  section: MenuSectionType;
  onItemPress: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  section,
  onItemPress,
}) => {
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      {/* Section title */}
      {section.title ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: Colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          {section.title}
        </Text>
      ) : null}

      {/* Items card */}
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: Colors.borderLight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        {section.items.map((item, index) => (
          <MenuItemRow
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === section.items.length - 1}
            onPress={onItemPress}
          />
        ))}
      </View>
    </View>
  );
};