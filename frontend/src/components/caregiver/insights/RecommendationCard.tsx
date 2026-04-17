import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Recommendation } from '../../../types/caregiver.types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  onDismiss: (id: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation: rec,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleDismiss = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss(rec.id));
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: Colors.white,
          borderRadius: 18,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderWidth: 1,
          borderColor: Colors.borderLight,
          borderLeftWidth: 4,
          borderLeftColor: rec.color,
          shadowColor: rec.color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: rec.bgColor,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Ionicons
            name={rec.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={rec.color}
          />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Text
              style={{
                fontSize: 13, fontWeight: '700',
                color: Colors.textPrimary, flex: 1,
              }}
            >
              {rec.title}
            </Text>
            {rec.urgent && (
              <View
                style={{
                  paddingHorizontal: 6, paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: Colors.dangerSoft,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.danger }}>
                  URGENT
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 17 }}>
            {rec.description}
          </Text>
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: Colors.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};