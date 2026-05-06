import { authFetch } from '@/src/api/authApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OnboardingStep3() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [favoritePlaces, setFavoritePlaces] = useState('');
  const [festivals, setFestivals] = useState('');
  const [foods, setFoods] = useState('');
  const [sports, setSports] = useState('');
  const [languages, setLanguages] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const profileData = {
        fullName: params.fullName,
        age: params.age,
        gender: params.gender,
        countriesLived: params.countriesLived,
        occupations: params.occupations,
        favoritePlaces,
        festivalsCelebrated: festivals,
        foodsPreferred: foods,
        preferredSports: sports,
        languagesPreferred: languages,
      };

      const result = await authFetch('/patient/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      if (result.success) {
        Alert.alert('Success', 'Profile completed!', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
      } else {
        // Even if profile save fails, go to login
        router.replace('/auth/login');
      }
    } catch (error) {
      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 48 }}>

      {/* Progress Bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
        <View style={{ flex: 1, height: 4, backgroundColor: '#2563eb', borderRadius: 2 }} />
      </View>
      <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 32 }}>Step 3 of 3</Text>

      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Your Preferences</Text>
      <Text style={{ color: '#6b7280', marginBottom: 32 }}>Tell us what you love</Text>

      {[
        { label: 'Favorite Places', placeholder: 'e.g. Beach, Mountains', value: favoritePlaces, setter: setFavoritePlaces },
        { label: 'Festivals Celebrated', placeholder: 'e.g. Sinhala New Year, Christmas', value: festivals, setter: setFestivals },
        { label: 'Foods Preferred', placeholder: 'e.g. Rice, Curry', value: foods, setter: setFoods },
        { label: 'Preferred Sports', placeholder: 'e.g. Cricket, Swimming', value: sports, setter: setSports },
        { label: 'Languages Preferred', placeholder: 'e.g. Sinhala, English', value: languages, setter: setLanguages },
      ].map((field) => (
        <View key={field.label}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>{field.label}</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 }}
            placeholder={field.placeholder}
            value={field.value}
            onChangeText={field.setter}
          />
        </View>
      ))}

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' }}
        >
          <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          style={{ flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Complete</Text>
          }
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}