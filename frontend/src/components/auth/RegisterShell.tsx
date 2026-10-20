import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardTypeOptions, Text, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyboardAwareScrollView, KeyboardAwareTextInput as TextInput } from '../common/KeyboardAware';
import PrimaryButton from '../common/PrimaryButton';
import ScreenBackground from '../common/ScreenBackground';

export type RegisterField = {
  label: string;
  placeholder: string;
  value: string;
  setter: (v: string) => void;
  secure?: boolean;
  keyboard?: KeyboardTypeOptions;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  title: string;
  subtitle: string;
  roleIcon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentBg: string;
  fields: RegisterField[];
  loading: boolean;
  onSubmit: () => void;
};

function FieldRow({ f, last, onNext, inputRef }: {
  f: RegisterField; last: boolean; onNext: () => void; inputRef: (r: RNTextInput | null) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: last ? 24 : 18 }}>
      <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>{f.label}</Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14,
        borderWidth: 1.5, borderColor: focused ? '#2563eb' : 'transparent',
        backgroundColor: focused ? '#fff' : '#F1F5FB',
      }}>
        <Ionicons name={f.icon} size={20} color="#94A3B8" />
        <TextInput
          ref={inputRef}
          style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#0F172A' }}
          placeholder={f.placeholder}
          placeholderTextColor="#94A3B8"
          value={f.value}
          onChangeText={f.setter}
          secureTextEntry={f.secure && !show}
          keyboardType={f.keyboard ?? 'default'}
          autoCapitalize={f.keyboard === 'email-address' || f.secure ? 'none' : 'words'}
          autoCorrect={false}
          returnKeyType={last ? 'done' : 'next'}
          onSubmitEditing={onNext}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {f.secure && (
          <TouchableOpacity onPress={() => setShow(!show)} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterShell({ title, subtitle, roleIcon, accent, accentBg, fields, loading, onSubmit }: Props) {
  const router = useRouter();
  const refs = useRef<(RNTextInput | null)[]>([]);

  return (
    <ScreenBackground tint={accentBg}>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#1e40af" />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: accentBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name={roleIcon} size={30} color={accent} />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>{title}</Text>
          <Text style={{ color: '#64748b', fontSize: 16, marginBottom: 24 }}>{subtitle}</Text>

          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 20,
            shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
          }}>
            {fields.map((f, i) => (
              <FieldRow
                key={f.label}
                f={f}
                last={i === fields.length - 1}
                inputRef={(r) => { refs.current[i] = r; }}
                onNext={() => (i === fields.length - 1 ? onSubmit() : refs.current[i + 1]?.focus())}
              />
            ))}
            <PrimaryButton label={loading ? 'Creating account…' : 'Register'} onPress={onSubmit} disabled={loading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#64748b' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>Login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </ScreenBackground>
  );
}
