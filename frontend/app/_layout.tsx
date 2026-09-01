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
        />
        <NotificationToastHost />
      </NotificationToastProvider>
    </GestureHandlerRootView>
  );
}