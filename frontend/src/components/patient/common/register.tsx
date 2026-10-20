import { registerUser } from "@/src/api/authApi";
import {
    FamilyMember,
    FoodItem,
    Step1Data,
    Step2Data,
    Step3Data,
} from "@/src/types/PatientRegisterTypes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "@/src/components/common/KeyboardAware";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import Step1BasicInfo from "./step1";
import Step2PersonalMemories from "./step2";
import Step3Preferences from "./step3";

export default function PatientRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentStep]);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    familyMembers: [] as FamilyMember[],
    lifeEvents: [],
    hometown: "",
    countriesLived: [],
    occupations: [],
  });

  const [step3Data, setStep3Data] = useState<Step3Data>({
    favoritePhotos: [] as string[],
    favoritePlaces: [] as string[],
    festivalsCelebrated: [] as string[],
    foodsPreferred: [] as FoodItem[],
    preferredSports: [] as string[],
    languagesPreferred: "",
  });

  // ── Step 1 validation ──────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    if (!step1Data.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!step1Data.email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!step1Data.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (!step1Data.password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (step1Data.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (!step1Data.age.trim()) {
      Alert.alert("Error", "Please enter your age");
      return false;
    }
    if (!step1Data.gender) {
      Alert.alert("Error", "Please select your gender");
      return false;
    }
    return true;
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  const handleBackPress = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleNextStep = () => {
    // Validate step 1 before proceeding
    if (currentStep === 1 && !validateStep1()) return;

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // ── Submit to backend ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await registerUser(
        step1Data.fullName,
        step1Data.email,
        step1Data.password,
        "patient",
        {
          // Step 1 extra
          age: Number(step1Data.age),
          gender: step1Data.gender,

          // Step 2
          familyMembers: step2Data.familyMembers,
          lifeEvents: step2Data.lifeEvents,
          hometown: step2Data.hometown,
          countriesLived: step2Data.countriesLived,
          occupations: step2Data.occupations,

          // Step 3
          favoritePhotos: step3Data.favoritePhotos,
          favoritePlaces: step3Data.favoritePlaces,
          festivalsCelebrated: step3Data.festivalsCelebrated,
          foodsPreferred: step3Data.foodsPreferred,
          preferredSports: step3Data.preferredSports,
        },
      );

      if (result.success) {
        Alert.alert(
          "Success! 🎉",
          "Patient profile created successfully! Redirecting to login...",
        );
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      } else {
        // ✅ Show exact error from backend
        console.log("Registration failed:", result);
        Alert.alert(
          "Registration Failed",
          result.message || "Please try again.",
        );
      }
    } catch (error) {
      console.log("Registration error:", error);
      Alert.alert("Error", "Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar ───────────────────────────────────────────────────────
  const stepTitles = ["Basic Info", "Personal Memories", "Preferences"];
  const renderProgressBar = () => (
    <View className="px-6 pb-2">
      <View className="flex-row gap-2 mb-2">
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            className={`flex-1 h-1.5 rounded-full ${
              currentStep >= step ? "bg-blue-600" : "bg-blue-100"
            }`}
          />
        ))}
      </View>
      <Text className="text-xs font-semibold tracking-wider text-slate-500">
        STEP {currentStep} OF 3 · {stepTitles[currentStep - 1].toUpperCase()}
      </Text>
    </View>
  );

  return (
    <ScreenBackground>
      <KeyboardAwareScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="px-6 pb-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleBackPress}
            className="w-11 h-11 rounded-full bg-white justify-center items-center shadow-sm"
          >
            <Ionicons name="chevron-back" size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-slate-900">
            Patient Profile
          </Text>
        </View>

        {renderProgressBar()}

        {/* Form Content */}
        <View className="px-5 pt-3">
          <View
            className="bg-white rounded-3xl p-5"
            style={{
              shadowColor: "#1e3a8a",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            {currentStep === 1 && (
              <Step1BasicInfo
                data={step1Data}
                onChange={(partial) =>
                  setStep1Data((prev) => ({ ...prev, ...partial }))
                }
              />
            )}
            {currentStep === 2 && (
              <Step2PersonalMemories
                data={step2Data}
                onChange={(partial) =>
                  setStep2Data((prev) => ({ ...prev, ...partial }))
                }
              />
            )}
            {currentStep === 3 && (
              <Step3Preferences
                data={step3Data}
                showLanguagesPreferred={false}
                onChange={(partial) =>
                  setStep3Data((prev) => ({ ...prev, ...partial }))
                }
              />
            )}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View className="px-6 pt-6 gap-3 flex-row">
          {currentStep > 1 && (
            <View className="flex-1">
              <PrimaryButton
                variant="secondary"
                label="Previous"
                disabled={loading}
                onPress={() => setCurrentStep(currentStep - 1)}
              />
            </View>
          )}
          <View className="flex-1">
            <PrimaryButton
              label={
                loading
                  ? "Please wait…"
                  : currentStep === 3
                    ? "Complete Registration"
                    : "Next"
              }
              disabled={loading}
              onPress={handleNextStep}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </ScreenBackground>
  );
}
