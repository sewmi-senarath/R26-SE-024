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
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (hasNavigated.current) return;
      try {
        const user = await getStoredUser();
        const role = await getStoredRole();

        if (user && role) {
          const targetPath = role === 'caregiver' ? '/caregiver'
            : role === 'family' ? '/family'
            : '/patient';

          if (!pathname.startsWith(targetPath)) {
            hasNavigated.current = true;
            router.replace(targetPath);
          }
        } else {
          // No logged in user - redirect to welcome page
          if (pathname !== '/') {
            hasNavigated.current = true;
            router.replace('/');
          }
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}