import { loginUser, storage } from '@/src/api/authApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Platform, Text, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyboardAwareScrollView, KeyboardAwareTextInput as TextInput } from '@/src/components/common/KeyboardAware';
import PrimaryButton from '@/src/components/common/PrimaryButton';
import ScreenBackground from '@/src/components/common/ScreenBackground';

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

        // Drop every pre-login screen from the stack so a swipe-back / hardware
        // back from the dashboard can't return to the login/landing screens.
        const goHome = (path: string) => {
          if (Platform.OS === 'web') {
            window.location.href = path;
            return;
          }
          try {
            if (router.canDismiss()) router.dismissAll();
          } catch {
            // no dismissable screens - replace() below is enough
          }
          router.replace(path as never);
        };

        if (role === 'patient') {
          // One-shot flag: the landing screen shows the screening-test prompt
          // once per login, then clears this.
          await storage.setItem('pendingScreeningPrompt', '1');
          goHome('/patient/activity-selector');
        } else if (role === 'caregiver') {
          goHome('/caregiver');
        } else if (role === 'family') {
          goHome('/family');
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

  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const passRef = useRef<RNTextInput>(null);

  const inputBox = (focused: boolean) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const,
    borderWidth: 1.5, borderColor: focused ? '#2563eb' : 'transparent',
    backgroundColor: focused ? '#fff' : '#F1F5FB',
    borderRadius: 14, paddingHorizontal: 14,
  });

  return (
    <ScreenBackground>
      <KeyboardAwareScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#1e40af" />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{
              width: 128, height: 128, borderRadius: 64, backgroundColor: '#fff',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#2563eb', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 6,
            }}>
              <Image source={require('../../assets/images/logo.png')} style={{ width: 92, height: 92 }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#1e3a8a', marginTop: 20 }}>Welcome Back!</Text>
            <Text style={{ color: '#64748b', marginTop: 4, fontSize: 15 }}>Sign in to your account</Text>
          </View>

          <View style={{
            backgroundColor: '#fff', borderRadius: 24, padding: 20,
            shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
          }}>
            <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>Email</Text>
            <View style={[inputBox(emailFocus), { marginBottom: 18 }]}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" />
              <TextInput
                style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#0F172A' }}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />
            </View>

            <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>Password</Text>
            <View style={[inputBox(passFocus), { marginBottom: 24 }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
              <TextInput
                ref={passRef}
                style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#0F172A' }}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <PrimaryButton label={loading ? 'Signing in…' : 'Sign In'} onPress={handleLogin} disabled={loading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#64748b' }}>Do not have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/role/select')}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </ScreenBackground>
  );
}
