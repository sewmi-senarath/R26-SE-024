import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#EFF6FF' }}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 90, height: 90 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#1e40af', marginTop: 12 }}>
          Who are you?
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 6, textAlign: 'center', fontSize: 15 }}>
          Select your role to create your account
        </Text>
      </View>

      {/* Patient → /auth/register/patient */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/patient')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          borderLeftWidth: 5, borderLeftColor: '#ec4899',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#fce7f3', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="heart" size={26} color="#ec4899" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am a Patient</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I need help with my daily routine</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Patient Face Login → /patient/auth */}
      <TouchableOpacity
        onPress={() => router.push('/patient/auth')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          borderLeftWidth: 5, borderLeftColor: '#8B5CF6',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="scan-circle-outline" size={26} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>Patient Face Login</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>Log in instantly using your face</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Caregiver → /auth/register/caregiver */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/caregiver')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 16,
          borderLeftWidth: 5, borderLeftColor: '#3b82f6',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="shield-checkmark" size={26} color="#3b82f6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am a Caregiver</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I manage care for others</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Family → /auth/register/family */}
      <TouchableOpacity
        onPress={() => router.push('/auth/register/family')}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: 20,
          flexDirection: 'row', alignItems: 'center', marginBottom: 40,
          borderLeftWidth: 5, borderLeftColor: '#06b6d4',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#cffafe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Ionicons name="people" size={26} color="#06b6d4" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1f2937' }}>I am Family</Text>
          <Text style={{ color: '#6b7280', marginTop: 2 }}>I want to stay connected</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Login Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Log in</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
