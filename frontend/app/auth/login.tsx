import { loginUser } from '@/src/api/authApi';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        const role = result.data.user.role;

        // Tokens, user data and caregiverId are already persisted by
        // loginUser() in authApi. Nothing else to store here.

        if (role === 'patient') {
          if (Platform.OS === 'web') window.location.href = '/patient/activity-selector';
          else router.replace('/patient/activity-selector');
        } else if (role === 'caregiver') {
          if (Platform.OS === 'web') window.location.href = '/caregiver';
          else router.replace('/caregiver');
        } else if (role === 'family') {
          if (Platform.OS === 'web') window.location.href = '/family';
          else router.replace('/family');
        }
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 24, paddingTop: 48 }}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#6b7280', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginTop: 16 }}>
          Welcome Back!
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 15 }}>
          Sign in to your account
        </Text>
      </View>

      {/* Email */}
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>
        Email
      </Text>
      <TextInput
        style={{
          borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
          paddingHorizontal: 16, paddingVertical: 12,
          fontSize: 16, marginBottom: 16, backgroundColor: '#f9fafb',
        }}
        placeholder="Enter your email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>
        Password
      </Text>
      <View style={{
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 24, backgroundColor: '#f9fafb',
      }}>
        <TextInput
          style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 }}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ paddingHorizontal: 16 }}
        >
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: '#2563eb', paddingVertical: 16,
          borderRadius: 12, alignItems: 'center', marginBottom: 16,
          shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
        }}
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Sign In</Text>
        }
      </TouchableOpacity>

      {/* Register Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
        <Text style={{ color: '#6b7280' }}>Do not have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/role/select')}>
          <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}