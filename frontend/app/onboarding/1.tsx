import { getStoredUser } from '@/src/api/authApi';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import PrimaryButton from '@/src/components/common/PrimaryButton';
import { Field, WizardScreen } from '@/src/components/onboarding/WizardParts';

export default function OnboardingStep1() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const user = await getStoredUser();
      if (user?.fullName) setFullName(user.fullName);
    };
    loadUser();
  }, []);

  const handleNext = () => {
    if (!fullName || !age || !gender) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    router.push({ pathname: '/onboarding/2', params: { fullName, age, gender } });
  };

  return (
    <WizardScreen step={1} title="Basic Information" subtitle="Tell us about yourself">
      <Field label="Full Name *" placeholder="Enter your name" value={fullName} onChangeText={setFullName} />
      <Field label="Age *" placeholder="Enter your age" value={age} onChangeText={setAge} keyboardType="numeric" />

      <Text style={{ fontWeight: '600', color: '#334155', marginBottom: 8 }}>Gender *</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
        {['Male', 'Female', 'Other'].map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setGender(g)}
            style={{
              flex: 1, paddingVertical: 13, borderRadius: 999, alignItems: 'center',
              backgroundColor: gender === g ? '#2563eb' : '#F1F5FB',
            }}
          >
            <Text style={{ fontWeight: '600', color: gender === g ? 'white' : '#475569' }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton label="Next" onPress={handleNext} />
    </WizardScreen>
  );
}