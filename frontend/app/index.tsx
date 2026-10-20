// import { Button } from "@react-navigation/elements";
// import { useRouter } from "expo-router";
// import { Text, View } from "react-native";
// import "../global.css";

// export default function Index() {
//   const router = useRouter();

//   const handleLoginPress = () => {
//     router.push("/auth/login");
//   };

//   const handleOnboardingPress = () => {
//     router.push("/onboarding/1");
//   };

//   const handleRoleSelect = () => {
//     router.push("/role/select")
//   }

//   const handleAssessmentPage = () => {
//     router.push("/patient/cognitive/assessment")
//   }

//   return (
//     <View className="flex-1 justify-center items-center">
//       <Text className="text-4xl font-bold p-3">
//         This page should replace with the correct user's dashboard based on their login
//       </Text>
//       <Button onPressIn={handleLoginPress} className="bg-white text-white">
//         Login
//       </Button>
//       <Button onPressIn={handleOnboardingPress} className="bg-white text-white">
//         Go to onboarding pages
//       </Button>
//       <Button onPressIn={handleRoleSelect} className="bg-white text-white">
//         Go to Role Selector Page
//       </Button>
//        <Button onPressIn={handleAssessmentPage} className="bg-white text-white">
//         Go to Assessment Page
        
//       </Button>
//     </View>
//   );
// }

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import PrimaryButton from '../src/components/common/PrimaryButton';
import ScreenBackground from '../src/components/common/ScreenBackground';
import { getAccessToken, getStoredRole } from '../src/api/authApi';

const HOME_BY_ROLE: Record<string, string> = {
  patient: '/patient/activity-selector',
  caregiver: '/caregiver',
  family: '/family',
};

export default function Index() {
  const router = useRouter();
  // undefined = still checking, null = no saved session, string = home route
  const [home, setHome] = useState<string | null | undefined>(undefined);

  // Restore the last logged-in user. loginUser() persists the tokens and role
  // to AsyncStorage, which survives app restarts; logoutUser() clears them.
  useEffect(() => {
    (async () => {
      const [token, role] = await Promise.all([getAccessToken(), getStoredRole()]);
      setHome(token && role ? HOME_BY_ROLE[role] ?? null : null);
    })();
  }, []);

  if (home === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (home) return <Redirect href={home as never} />;

  const chips = [
    { icon: 'heart' as const, label: 'Compassionate', color: '#ec4899' },
    { icon: 'people' as const, label: 'Connected', color: '#3b82f6' },
    { icon: 'shield-checkmark' as const, label: 'Secure', color: '#10b981' },
  ];

  return (
    <ScreenBackground>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 48, paddingHorizontal: 24 }}>

        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center' }}>
          <View style={{
            width: 190, height: 190, borderRadius: 95, backgroundColor: '#fff',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#2563eb', shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.18, shadowRadius: 28, elevation: 8,
          }}>
            <Image source={require('../assets/images/logo.png')} style={{ width: 140, height: 140 }} resizeMode="contain" />
          </View>
          <Text style={{ fontSize: 40, fontWeight: '800', color: '#1e3a8a', marginTop: 28, letterSpacing: -0.5 }}>
            MemoCare
          </Text>
          <Text style={{ fontSize: 16, color: '#64748b', marginTop: 8, textAlign: 'center', lineHeight: 24 }}>
            Connected care for what matters most
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {chips.map((c) => (
              <View key={c.label} style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
              }}>
                <Ionicons name={c.icon} size={14} color={c.color} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>{c.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(600)} style={{ width: '100%', gap: 14 }}>
          <PrimaryButton label="Get Started" onPress={() => router.push('/onboarding')} />
          <TouchableOpacity onPress={() => router.push('/auth/login')} style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ color: '#475569', fontSize: 15 }}>
              Already have an account? <Text style={{ color: '#2563eb', fontWeight: '700' }}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </ScreenBackground>
  );
}