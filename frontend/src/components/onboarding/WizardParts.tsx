import { ReactNode, useState } from 'react';
import { ScrollView, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenBackground from '../common/ScreenBackground';

export function WizardScreen({ step, title, subtitle, children }: {
  step: 1 | 2 | 3; title: string; subtitle: string; children: ReactNode;
}) {
  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? '#2563eb' : '#DCE6F8' }} />
          ))}
        </View>
        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '600', letterSpacing: 0.6, marginBottom: 28 }}>
          STEP {step} OF 3
        </Text>
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>{title}</Text>
          <Text style={{ color: '#64748b', fontSize: 16, marginBottom: 28 }}>{subtitle}</Text>
          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 20,
            shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
          }}>
            {children}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenBackground>
  );
}

export function Field({ label, last, ...props }: { label: string; last?: boolean } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: last ? 0 : 18 }}>
      <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: 1.5, borderColor: focused ? '#2563eb' : 'transparent',
          backgroundColor: focused ? '#fff' : '#F1F5FB', borderRadius: 14,
          paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0F172A',
        }}
        {...props}
      />
    </View>
  );
}
