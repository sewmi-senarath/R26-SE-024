import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import PrimaryButton from '@/src/components/common/PrimaryButton';
import { Field, WizardScreen } from '@/src/components/onboarding/WizardParts';

export default function OnboardingStep2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [countriesLived, setCountriesLived] = useState('');
  const [occupations, setOccupations] = useState('');

  const handleNext = () => {
    router.push({ pathname: '/onboarding/3', params: { ...params, countriesLived, occupations } });
  };

  return (
    <WizardScreen step={2} title="Personal Memories" subtitle="Share your cherished moments">
      <Field label="Countries Lived" placeholder="e.g. Sri Lanka, UK" value={countriesLived} onChangeText={setCountriesLived} />
      <Field label="Occupation(s)" placeholder="e.g. Teacher, Farmer, Engineer" value={occupations} onChangeText={setOccupations} last />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
        <View style={{ flex: 1 }}><PrimaryButton variant="secondary" label="Previous" onPress={() => router.back()} /></View>
        <View style={{ flex: 1 }}><PrimaryButton label="Next" onPress={handleNext} /></View>
      </View>
    </WizardScreen>
  );
}
