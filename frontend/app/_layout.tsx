import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { NotificationToastProvider } from "../src/context/Notificationtoastcontext";
import { NotificationToastHost } from "../src/context/Notificationtoast";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationToastProvider>
        <Stack
          screenOptions={{
            headerTitle: "MemoCare",
          }}
        >
          {/* Authenticated areas: once you're in, the swipe-back / hardware-back
              gesture must NOT pop back out to the pre-login screens. Logout is
              the only way out. Navigation *inside* each area still works because
              that's handled by each area's own nested navigator. */}
          <Stack.Screen
            name="patient"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="caregiver"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="family"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
        <NotificationToastHost />
      </NotificationToastProvider>
    </GestureHandlerRootView>
  );
}