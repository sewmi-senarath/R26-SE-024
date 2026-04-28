import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { EngagementAlert } from '../../../types/family.types';

interface SmartAlertCardProps {
  alert: EngagementAlert;
  onCallNow: () => void;
  onDismiss: () => void;
}

const STAGE_LABELS: Record<number, string> = {
  1: 'Story Played',
  2: 'Mood Detected',
  3: 'Call Window Open',
  4: 'Post-Call Review',
};

const STAGE_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'musical-notes',
  2: 'analytics',
  3: 'call',
  4: 'stats-chart',
};

export const SmartAlertCard: React.FC<SmartAlertCardProps> = ({
  alert, onCallNow, onDismiss,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={{ marginHorizontal: 20, marginTop: 20 }}>
      {/* Header badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.success, letterSpacing: 0.6 }}>
          PREDICTIVE ENGAGEMENT · LIVE
        </Text>
      </View>

      <View
        style={{
          backgroundColor: '#0F172A',
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: '#1E3A5F',
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* Stage step indicators */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          {[1, 2, 3, 4].map((s) => {
            const isActive = s === alert.stage;
            const isDone = s < alert.stage;
            return (
              <React.Fragment key={s}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isActive
                        ? Colors.primary
                        : isDone
                        ? Colors.success
                        : '#1E293B',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: isActive
                        ? Colors.primary
                        : isDone
                        ? Colors.success
                        : '#334155',
                    }}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Ionicons name={STAGE_ICONS[s]} size={14} color={isActive ? '#fff' : '#475569'} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 9,
                      color: isActive ? Colors.primary : isDone ? Colors.success : '#475569',
                      marginTop: 4,
                      fontWeight: '600',
                      textAlign: 'center',
                      width: 52,
                    }}
                  >
                    {STAGE_LABELS[s]}
                  </Text>
                </View>
                {s < 4 && (
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: s < alert.stage ? Colors.success : '#1E293B',
                      marginBottom: 16,
                      marginHorizontal: 2,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Mood shift numbers */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            marginBottom: 14,
            gap: 16,
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 4 }}>SAD BEFORE</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#F87171' }}>{alert.sadBefore}%</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155' }}>
            <Text style={{ fontSize: 10, color: Colors.success, fontWeight: '700', marginBottom: 4 }}>MOOD SHIFT</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.success }}>+{alert.moodShift}%</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 4 }}>HAPPY NOW</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#4ADE80' }}>{alert.happyAfter}%</Text>
          </View>
        </View>

        {/* Message */}
        <Text style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 21, marginBottom: 16 }}>
          <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>
            "{alert.storyTitle}"
          </Text>
          {' '}made her smile.{'\n'}{alert.message}
        </Text>

        {/* Triggered at */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <Text style={{ fontSize: 11, color: '#64748B' }}>Alert triggered {alert.triggeredAt}</Text>
        </View>

        {/* CTA Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Animated.View style={{ flex: 1, transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={onCallNow}
              activeOpacity={0.85}
              style={{
                backgroundColor: Colors.success,
                borderRadius: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Call Now</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            onPress={onDismiss}
            style={{
              paddingHorizontal: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#334155',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#64748B', fontWeight: '600', fontSize: 13 }}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
