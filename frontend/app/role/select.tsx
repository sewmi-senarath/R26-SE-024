import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScreenBackground from '../../src/components/common/ScreenBackground';

const roles = [
  { href: '/auth/register/patient', icon: 'heart', color: '#ec4899', bg: '#fce7f3', title: 'I am a Patient', sub: 'I need help with my daily routine' },
  { href: '/auth/register/caregiver', icon: 'shield-checkmark', color: '#3b82f6', bg: '#dbeafe', title: 'I am a Caregiver', sub: 'I manage care for others' },
  { href: '/auth/register/family', icon: 'people', color: '#06b6d4', bg: '#cffafe', title: 'I am Family', sub: 'I want to stay connected' },
] as const;

export default function RoleSelect() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 84, height: 84 }} resizeMode="contain" />
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#1e3a8a', marginTop: 12 }}>Who are you?</Text>
          <Text style={{ color: '#64748b', marginTop: 6, textAlign: 'center', fontSize: 15 }}>
            Select your role to create your account
          </Text>
        </View>

        {roles.map((r, i) => (
          <Animated.View key={r.title} entering={FadeInDown.delay(i * 90).duration(450)}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(r.href as never)}
              style={{
                backgroundColor: '#fff', borderRadius: 22, padding: 18,
                flexDirection: 'row', alignItems: 'center', marginBottom: 14,
                shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08, shadowRadius: 18, elevation: 4,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Ionicons name={r.icon} size={28} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}>{r.title}</Text>
                <Text style={{ color: '#64748b', marginTop: 2 }}>{r.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#64748b' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: '#2563eb', fontWeight: '700' }}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}
