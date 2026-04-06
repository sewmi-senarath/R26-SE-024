import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "MemoCare", // Default title for all screens
      }}
    >
    </Stack>
  );
}