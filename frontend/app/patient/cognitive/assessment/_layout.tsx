import { Stack } from 'expo-router';

export default function AssessmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[questionIndex]" />
      <Stack.Screen name="results" />
      <Stack.Screen name="functional-activities" />
    </Stack>
  );
}