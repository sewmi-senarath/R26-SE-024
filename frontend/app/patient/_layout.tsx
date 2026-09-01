import { Stack } from 'expo-router';

// Let Expo Router auto-discover the child routes ((tabs), cognitive/assessment,
// cognitive/games). Declaring them explicitly is unnecessary here and, when a
// declared name doesn't line up exactly with a real route, iOS native builds
// crash the navigator (web only warns) - bare auto-discovery avoids that.
export default function PatientLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
