import * as Haptics from 'expo-haptics';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, variant = 'primary', disabled }: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const primary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
    >
      <Animated.View
        style={[
          {
            paddingVertical: 17, borderRadius: 999, alignItems: 'center',
            backgroundColor: primary ? '#2563eb' : '#FFFFFF',
            borderWidth: primary ? 0 : 1.5, borderColor: '#BFD3FB',
            opacity: disabled ? 0.6 : 1,
          },
          primary && {
            shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
          },
          style,
        ]}
      >
        <Text style={{ color: primary ? '#fff' : '#1d4ed8', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
