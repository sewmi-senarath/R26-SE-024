import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerTitle: "MemoCare",
        }}
      >
        <Stack.Screen name="patient" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
