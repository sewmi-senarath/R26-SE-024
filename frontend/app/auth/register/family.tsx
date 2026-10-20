import { registerUser, storage } from '@/src/api/authApi';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import RegisterShell from '@/src/components/auth/RegisterShell';

export default function FamilyRegister() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

const handleRegister = async () => {
  console.log('family.tsx: Starting handleRegister...');
  console.log('family.tsx: State =', { fullName, email, passwordLength: password.length, confirmLength: confirmPassword.length });

  if (!fullName || !email || !patientEmail || !password || !confirmPassword) {
    console.log('family.tsx: Validation FAILED - Missing fields');
    Alert.alert('Error', 'Please fill all fields'); return;
  }
  if (password !== confirmPassword) {
    console.log('family.tsx: Validation FAILED - Passwords do not match');
    Alert.alert('Error', 'Passwords do not match'); return;
  }
  if (password.length < 6) {
    console.log('family.tsx: Validation FAILED - Password too short');
    Alert.alert('Error', 'Password must be at least 6 characters'); return;
  }

  console.log('family.tsx: All validations passed. Setting loading = true...');
  setLoading(true);
  try {
    console.log('family.tsx: calling registerUser API...');
    const result = await registerUser(fullName, email, password, 'family', { patientEmail });
    console.log('family.tsx: registration result:', JSON.stringify(result));
    
    if (result.success) {
      console.log('family.tsx: Success! Saving tokens...');
      // ✅ Success - Save auth data
      const { accessToken, refreshToken, user } = result.data;
      
      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', refreshToken);
      await storage.setItem('userRole', user.role);
      await storage.setItem('userData', JSON.stringify(user));

      console.log('family.tsx: Data saved. Navigating to /family...');
      if (Platform.OS === 'web') {
        window.location.href = '/family';
      } else {
        router.replace('/family');
      }
    } else {
      console.log('family.tsx: Registration failed:', result.message);
      Alert.alert('Registration Failed', result.message || 'Could not complete registration.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    Alert.alert('Error', 'Cannot connect to server.');
  } finally {
    setLoading(false);
  }
};
  return (
    <RegisterShell
      title="Family Registration"
      subtitle="Stay connected with your loved ones"
      roleIcon="people"
      accent="#06b6d4"
      accentBg="#cffafe"
      loading={loading}
      onSubmit={handleRegister}
      fields={[
        { label: 'Full Name', placeholder: 'Enter your full name', value: fullName, setter: setFullName, icon: 'person-outline' },
        { label: 'Email Address', placeholder: 'Enter your email', value: email, setter: setEmail, keyboard: 'email-address', icon: 'mail-outline' },
        { label: "Patient's Email Address", placeholder: "Enter the patient's login email", value: patientEmail, setter: setPatientEmail, keyboard: 'email-address', icon: 'medkit-outline' },
        { label: 'Password', placeholder: 'Create a password', value: password, setter: setPassword, secure: true, icon: 'lock-closed-outline' },
        { label: 'Confirm Password', placeholder: 'Confirm your password', value: confirmPassword, setter: setConfirmPassword, secure: true, icon: 'shield-checkmark-outline' },
      ]}
    />
  );
}
