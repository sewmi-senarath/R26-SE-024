import { authFetch } from '@/src/api/authApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import PrimaryButton from '@/src/components/common/PrimaryButton';
import { Field, WizardScreen } from '@/src/components/onboarding/WizardParts';

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
    <WizardScreen step={3} title="Your Preferences" subtitle="Tell us what you love">
      {[
        { label: 'Favorite Places', placeholder: 'e.g. Beach, Mountains', value: favoritePlaces, setter: setFavoritePlaces },
        { label: 'Festivals Celebrated', placeholder: 'e.g. Sinhala New Year, Christmas', value: festivals, setter: setFestivals },
        { label: 'Foods Preferred', placeholder: 'e.g. Rice, Curry', value: foods, setter: setFoods },
        { label: 'Preferred Sports', placeholder: 'e.g. Cricket, Swimming', value: sports, setter: setSports },
        { label: 'Languages Preferred', placeholder: 'e.g. Sinhala, English', value: languages, setter: setLanguages },
      ].map((field, i, arr) => (
        <Field
          key={field.label}
          label={field.label}
          placeholder={field.placeholder}
          value={field.value}
          onChangeText={field.setter}
          last={i === arr.length - 1}
        />
      ))}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
        <View style={{ flex: 1 }}><PrimaryButton variant="secondary" label="Previous" onPress={() => router.back()} /></View>
        <View style={{ flex: 1 }}>
          <PrimaryButton label={loading ? 'Saving…' : 'Complete'} onPress={handleComplete} disabled={loading} />
        </View>
      </View>
    </WizardScreen>
  );
}