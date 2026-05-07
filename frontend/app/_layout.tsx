// import { Stack } from "expo-router";
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// export default function RootLayout() {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Stack
//         screenOptions={{
//           headerTitle: "MemoCare",
//         }}
//       >
//       </Stack>
//     </GestureHandlerRootView>
//   );
// }

import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';
import { getStoredRole, getStoredUser } from '../src/api/authApi';

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
