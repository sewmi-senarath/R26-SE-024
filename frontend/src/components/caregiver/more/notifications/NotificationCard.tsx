import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/colors';
import { AppNotification } from '../../../../types/caregiver.types';

const severityConfig = {
  urgent:  { color: Colors.danger,  bg: Colors.dangerSoft,  icon: 'alert-circle'      as const, label: 'Urgent'  },
  warning: { color: Colors.warning, bg: Colors.warningSoft, icon: 'warning'            as const, label: 'Warning' },
  info:    { color: Colors.success, bg: Colors.successSoft, icon: 'checkmark-circle'  as const, label: 'Info'    },
};

interface NotificationCardProps {
  notification: AppNotification;
  onAcknowledge: (id: string) => void;
  onAction?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification: notif, onAcknowledge, onAction,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cfg = severityConfig[notif.severity];

  const handleAcknowledge = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start(() => onAcknowledge(notif.id));
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View
        style={{
          marginHorizontal: 20, marginBottom: 10,
          backgroundColor: notif.acknowledged ? '#FAFBFF' : Colors.white,
          borderRadius: 20, padding: 16,
          borderWidth: 1.5,
          borderColor: notif.acknowledged ? Colors.borderLight : cfg.color + '40',
          borderLeftWidth: 4,
          borderLeftColor: notif.acknowledged ? Colors.borderLight : cfg.color,
          shadowColor: notif.acknowledged ? 'transparent' : cfg.color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: notif.acknowledged ? 0 : 2,
          opacity: notif.acknowledged ? 0.65 : 1,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View
            style={{
              width: 34, height: 34, borderRadius: 11,
              backgroundColor: notif.acknowledged ? Colors.borderLight : cfg.bg,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons
              name={cfg.icon}
              size={17}
              color={notif.acknowledged ? Colors.textMuted : cfg.color}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: notif.acknowledged ? Colors.textMuted : Colors.textPrimary }}>
              {notif.patientName}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '500' }}>
            {notif.time}
          </Text>
        </View>

        {/* Message */}
        <Text
          style={{
            fontSize: 13, color: Colors.textSecondary,
            lineHeight: 18, marginBottom: 12,
            textDecorationLine: notif.acknowledged ? 'line-through' : 'none',
          }}
        >
          {notif.message}
        </Text>

        {/* Actions */}
        {!notif.acknowledged && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleAcknowledge}
              style={{
                paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: Colors.border,
                backgroundColor: Colors.white,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary }}>
                Acknowledge
              </Text>
            </TouchableOpacity>

            {notif.hasAction && (
              <TouchableOpacity
                onPress={() => onAction?.(notif.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: cfg.color,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.white }}>
                  {notif.actionLabel ?? 'Take Action'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {notif.acknowledged && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.success }}>
              Acknowledged
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};