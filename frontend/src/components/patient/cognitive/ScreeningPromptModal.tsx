import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { storage } from "@/src/api/authApi";

// Shown once per login, the first time the patient opens the Brain Games page.
// login.tsx sets the "pendingScreeningPrompt" flag on a successful patient
// sign-in; this reads it on mount, shows the prompt, and clears the flag
// straight away so it only appears once until the next login (Skip and Start
// both leave it cleared).
const FLAG_KEY = "pendingScreeningPrompt";

export default function ScreeningPromptModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = await storage.getItem(FLAG_KEY);
      if (cancelled) return;
      if (pending === "1") {
        await storage.setItem(FLAG_KEY, "0");
        setVisible(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => setVisible(false);

  const startTest = () => {
    setVisible(false);
    router.push("/patient/cognitive/assessment");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="w-full max-w-[420px] bg-white rounded-3xl p-6">
          <View className="w-16 h-16 rounded-2xl bg-blue-100 items-center justify-center mb-4">
            <Ionicons name="medkit-outline" size={30} color="#3b82f6" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            A quick memory check
          </Text>
          <Text className="text-base text-gray-600 leading-relaxed mb-6">
            Would you like to take a short screening test to check your memory and
            thinking? It only takes a few minutes.
          </Text>

          <TouchableOpacity
            onPress={startTest}
            activeOpacity={0.8}
            className="w-full bg-blue-500 py-4 rounded-2xl items-center mb-3"
          >
            <Text className="text-white font-semibold text-base">Start test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={close}
            activeOpacity={0.7}
            className="w-full py-3 rounded-2xl items-center"
          >
            <Text className="text-gray-500 font-medium text-base">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
