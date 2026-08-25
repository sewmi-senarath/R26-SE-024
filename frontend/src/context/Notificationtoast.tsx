import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  Easing,
  SlideInUp,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { useNotificationToast } from './Notificationtoastcontext';

const AUTO_DISMISS_MS = 4500;

const severityConfig = {
  urgent:  { color: Colors.danger,  icon: 'alert-circle'     as const },
  warning: { color: Colors.warning, icon: 'warning'          as const },
  info:    { color: Colors.success, icon: 'checkmark-circle' as const },
};


const ToastBlob: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 38, height: 38, borderRadius: 13,
          backgroundColor: color, alignItems: 'center', justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const NotificationToastHost: React.FC = () => {
  const { currentToast, dismissCurrentToast } = useNotificationToast();

  useEffect(() => {
    if (!currentToast) return;
    const timer = setTimeout(dismissCurrentToast, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToast]);

  if (!currentToast) return null;

  const cfg = severityConfig[currentToast.severity];

  const handlePress = () => {
    dismissCurrentToast();
    router.push('/caregiver/alerts' as any);
  };

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(16)}
      exiting={SlideOutUp.duration(250)}
      style={{
        position: 'absolute', top: 54, left: 16, right: 16, zIndex: 999,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={{
          backgroundColor: Colors.white,
          borderRadius: 20, padding: 14,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          borderWidth: 1.5, borderColor: cfg.color + '30',
          shadowColor: cfg.color,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2, shadowRadius: 14,
          elevation: 8,
        }}
      >
        <ToastBlob color={cfg.color}>
          <Ionicons name={cfg.icon} size={18} color={Colors.white} />
        </ToastBlob>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.textPrimary }} numberOfLines={1}>
            {currentToast.patientName}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 1 }} numberOfLines={2}>
            {currentToast.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={dismissCurrentToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: Colors.borderLight,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};