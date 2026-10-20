import { registerUser } from '@/src/api/authApi';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import RegisterShell from '@/src/components/auth/RegisterShell';

export default function CaregiverRegister() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

const handleRegister = async () => {
  if (!fullName || !email || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill all fields'); return;
  }
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match'); return;
  }
  if (password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters'); return;
  }

  setLoading(true);
  try {
    const result = await registerUser(fullName, email, password, 'caregiver');
    if (result.success) {
      // ✅ Show success then auto redirect
      Alert.alert('Success ✅', 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 1500);
    } else {
      // ✅ Only shows error - no redirect
      Alert.alert('Registration Failed', result.message);
    }
  } catch {
    Alert.alert('Error', 'Cannot connect to server.');
  } finally {
    setLoading(false);
  }
};
  return (
    <RegisterShell
      title="Caregiver Registration"
      subtitle="Create your account to get started"
      roleIcon="shield-checkmark"
      accent="#3b82f6"
      accentBg="#dbeafe"
      loading={loading}
      onSubmit={handleRegister}
      fields={[
        { label: 'Full Name', placeholder: 'Enter your full name', value: fullName, setter: setFullName, icon: 'person-outline' },
        { label: 'Email Address', placeholder: 'Enter your email', value: email, setter: setEmail, keyboard: 'email-address', icon: 'mail-outline' },
        { label: 'Password', placeholder: 'Create a password', value: password, setter: setPassword, secure: true, icon: 'lock-closed-outline' },
        { label: 'Confirm Password', placeholder: 'Confirm your password', value: confirmPassword, setter: setConfirmPassword, secure: true, icon: 'shield-checkmark-outline' },
      ]}
    />
  );
}
