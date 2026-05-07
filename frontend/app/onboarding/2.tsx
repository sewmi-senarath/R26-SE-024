import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OnboardingStep2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [countriesLived, setCountriesLived] = useState('');
  const [occupations, setOccupations] = useState('');

  const handleNext = () => {
    router.push({ pathname: '/onboarding/3', params: { ...params, countriesLived, occupations } });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 48 }}>

      {/* Progress Bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2 }} />
      </View>
      <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 32 }}>Step 2 of 3</Text>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Personal Memories</Text>
      <Text style={{ color: '#6b7280', marginBottom: 32 }}>Share your cherished moments</Text>

      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Countries Lived</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 }}
        placeholder="e.g. Sri Lanka, UK"
        value={countriesLived}
        onChangeText={setCountriesLived}
      />

      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Occupation(s)</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 40 }}
        placeholder="e.g. Teacher, Farmer, Engineer"
        value={occupations}
        onChangeText={setOccupations}
      />

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' }}
        >
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={{ flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Next</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}