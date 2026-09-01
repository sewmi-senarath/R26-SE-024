import { getMe, getMePhotos, updateMe } from "@/src/api/authApi";
import {
  FamilyMember,
  FoodItem,
  Step1Data,
  Step2Data,
  Step3Data,
} from "@/src/types/PatientRegisterTypes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Step1BasicInfo from "../step1";
import Step2PersonalMemories from "../step2";
import Step3Preferences from "../step3";

/**
 * Reuses the registration wizard (Step 1–3) to let a patient edit the
 * details they entered when they registered. Prefills from /auth/me
 * (+ /auth/me/photos for images) and saves via PUT /auth/me.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    familyMembers: [],
    lifeEvents: [],
    hometown: "",
    countriesLived: [],
    occupations: [],
  });
  const [step3Data, setStep3Data] = useState<Step3Data>({
    favoritePhotos: [],
    favoritePlaces: [],
    festivalsCelebrated: [],
    foodsPreferred: [],
    preferredSports: [],
    languagesPreferred: "",
  });

  // ── Load existing details ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [meRes, photoRes] = await Promise.all([getMe(), getMePhotos()]);
        if (!mounted) return;

        if (!meRes?.success) {
          Alert.alert(
            "Could not load",
            meRes?.message || "Please try again.",
          );
          router.back();
          return;
        }

        const u = meRes.data.user;
        const photos = photoRes?.success ? photoRes.data.photos : null;

        // Merge stored photos back into family members (photos are not in /me).
        const photoById: Record<string, string | null> = {};
        (photos?.familyMembers || []).forEach((m: FamilyMember) => {
          if (m.id) photoById[m.id] = m.photo ?? null;
        });

        setStep1Data({
          fullName: u.fullName ?? "",
          email: u.email ?? "",
          password: "",
          age: u.age != null ? String(u.age) : "",
          gender: u.gender ?? "",
        });

        setStep2Data({
          familyMembers: (u.familyMembers || []).map((m: FamilyMember) => ({
            id: m.id,
            name: m.name ?? "",
            relation: m.relation ?? "",
            photo: photoById[m.id] ?? null,
          })),
          lifeEvents: u.lifeEvents || [],
          hometown: u.hometown ?? "",
          countriesLived: u.countriesLived || [],
          occupations: u.occupations || [],
        });

        setStep3Data({
          favoritePhotos: photos?.favoritePhotos || [],
          favoritePlaces: u.favoritePlaces || [],
          festivalsCelebrated: u.festivalsCelebrated || [],
          foodsPreferred: (u.foodsPreferred || []) as FoodItem[],
          preferredSports: u.preferredSports || [],
          // Stored as an array on the server; the picker edits a single value.
          languagesPreferred: Array.isArray(u.languagesPreferred)
            ? u.languagesPreferred[0] ?? ""
            : u.languagesPreferred ?? "",
        });
      } catch {
        if (mounted) {
          Alert.alert("Error", "Cannot connect to server. Please try again.");
          router.back();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [router]);

  // ── Validation (no email / password in edit mode) ──────────────────────
  const validateStep1 = () => {
    if (!step1Data.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
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

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateMe({
        // Step 1
        fullName: step1Data.fullName,
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
        languagesPreferred: step3Data.languagesPreferred,
      });

      if (result?.success) {
        Alert.alert("Saved", "Your details have been updated.");
        router.back();
      } else {
        Alert.alert("Update Failed", result?.message || "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Cannot connect to server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-3">Loading your details…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-white justify-center items-center shadow-sm"
          >
            <Ionicons name="chevron-back" size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Update My Details
          </Text>
        </View>

        {/* Progress */}
        <View className="px-6 py-4">
          <View className="flex-row gap-2 mb-2">
            {[1, 2, 3].map((step) => (
              <View key={step} className="flex-1">
                <View
                  className={`h-1 rounded-full ${
                    currentStep >= step ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              </View>
            ))}
          </View>
          <Text className="text-sm text-gray-600 text-center">
            Step {currentStep} of 3 -{" "}
            {currentStep === 1
              ? "Basic Info"
              : currentStep === 2
                ? "Personal Memories"
                : "Preferences"}
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 pb-6">
          {currentStep === 1 && (
            <Step1BasicInfo
              data={step1Data}
              editMode
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
              onChange={(partial) =>
                setStep3Data((prev) => ({ ...prev, ...partial }))
              }
            />
          )}
        </View>

        {/* Navigation */}
        <View className="px-6 pb-10 gap-3 flex-row">
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={() => setCurrentStep(currentStep - 1)}
              className="flex-1 bg-gray-300 rounded-lg py-4 items-center"
              disabled={saving}
            >
              <Text className="text-gray-700 font-semibold">Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            disabled={saving}
            className="flex-1 bg-blue-600 rounded-lg py-4 items-center"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">
                {currentStep === 3 ? "Save Changes" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
