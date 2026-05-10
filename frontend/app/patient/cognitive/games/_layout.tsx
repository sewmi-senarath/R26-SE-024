import { Stack } from 'expo-router';
import { AssessmentProvider } from '../../../../src/context/AssessmentContext';

export default function GamesLayout() {
  return (
    <AssessmentProvider>
      <Stack
        screenOptions={{
          headerShown: false,      // hides the native header completely
          contentStyle: {
            backgroundColor: '#f9fafb',  // prevents white flash on navigation
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* <Stack.Screen name="[gameId]/index" options={{ headerShown: false }} /> */}
        <Stack.Screen name="memory_recall/play" options={{ headerShown: false }} />
        <Stack.Screen name="object_recall/play" options={{ headerShown: false }} />
        <Stack.Screen name="attention_game/play" options={{ headerShown: false }} />
        <Stack.Screen name="photo_puzzle/play" options={{ headerShown: false }} />
        <Stack.Screen name="word_puzzle/play" options={{ headerShown: false }} />
      </Stack>
    </AssessmentProvider>
  );
}