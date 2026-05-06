import { getStoredUser } from '@/src/api/authApi';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
      
      {/* Progress Bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }} />
      </View>
      <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 32 }}>Step 1 of 3</Text>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Basic Information</Text>
      <Text style={{ color: '#6b7280', marginBottom: 32 }}>Tell us about yourself</Text>

      {/* Full Name */}
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Full Name *</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 }}
        placeholder="Enter your name"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Age */}
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Age *</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 }}
        placeholder="Enter your age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      {/* Gender */}
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Gender *</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
        {['Male', 'Female', 'Other'].map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setGender(g)}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
              backgroundColor: gender === g ? '#2563eb' : 'white',
              borderWidth: 1,
              borderColor: gender === g ? '#2563eb' : '#d1d5db',
            }}
          >
            <Text style={{ fontWeight: '600', color: gender === g ? 'white' : '#374151' }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Next</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}