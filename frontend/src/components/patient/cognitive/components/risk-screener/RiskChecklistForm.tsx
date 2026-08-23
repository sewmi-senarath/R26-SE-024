import { useSoundEffects } from "@/src/hooks/useSoundEffects";
import {
  BEHAVIORAL_QUESTIONS,
  DEFAULT_RISK_CHECKLIST,
  EDUCATION_LEVELS,
  MEDICAL_HISTORY_QUESTIONS,
  RiskChecklist,
} from "@/src/types/dementia.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Text, TouchableOpacity, View } from "react-native";

// ── Icon per behavioral question ─────────────────────────────────────────
const QUESTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  memoryComplaints: "chatbox-ellipses-outline",
  forgetfulness: "time-outline",
  confusion: "help-circle-outline",
  disorientation: "compass-outline",
  difficultyCompletingTasks: "list-outline",
  personalityChanges: "happy-outline",
  behavioralProblems: "alert-circle-outline",
};

const TOTAL_QUESTION_STEPS = BEHAVIORAL_QUESTIONS.length; // 7
const ABOUT_STEP = TOTAL_QUESTION_STEPS; // 7
const HISTORY_CHOICE_STEP = TOTAL_QUESTION_STEPS + 1; // 8
const HISTORY_DETAILS_STEP = TOTAL_QUESTION_STEPS + 2; // 9

// ── Animated press-scale wrapper — gives every tap a little bounce ──────
const Bouncy: React.FC<{ onPress: () => void; children: React.ReactNode; style?: any; disabled?: boolean }> = ({
  onPress,
  children,
  style,
  disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <View className="flex-row items-center justify-between py-3 border-b border-gray-50">
    <Text className="flex-1 text-sm text-gray-700 pr-3">{label}</Text>
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => onChange(false)}
        className={`px-4 py-1.5 rounded-full ${!value ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <Text className={`text-xs font-semibold ${!value ? "text-white" : "text-gray-500"}`}>No</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(true)}
        className={`px-4 py-1.5 rounded-full ${value ? "bg-amber-500" : "bg-gray-100"}`}
      >
        <Text className={`text-xs font-semibold ${value ? "text-white" : "text-gray-500"}`}>Yes</Text>
      </TouchableOpacity>
    </View>
  </View>
);

interface RiskChecklistFormProps {
  initialAge?: number;
  initialGender?: string;
  loading: boolean;
  onSubmit: (checklist: RiskChecklist) => void;
}

export const RiskChecklistForm: React.FC<RiskChecklistFormProps> = ({
  initialAge,
  initialGender,
  loading,
  onSubmit,
}) => {
  const { playSound } = useSoundEffects();
  const [step, setStep] = useState(0);
  const [checklist, setChecklist] = useState<RiskChecklist>({
    ...DEFAULT_RISK_CHECKLIST,
    age: initialAge,
    gender: (initialGender?.[0]?.toUpperCase() as "M" | "F") || "",
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const set = <K extends keyof RiskChecklist>(key: K) => (value: RiskChecklist[K]) =>
    setChecklist((prev) => ({ ...prev, [key]: value }));

  const animateProgress = (nextStep: number) => {
    const pct = Math.min(nextStep, TOTAL_QUESTION_STEPS) / TOTAL_QUESTION_STEPS;
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const goToStep = (nextStep: number) => {
    animateProgress(nextStep);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -16, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(16);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const answerQuestion = (key: (typeof BEHAVIORAL_QUESTIONS)[number]["key"], value: boolean) => {
    void playSound("click");
    setChecklist((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => goToStep(step + 1), 220);
  };

  const isQuestionStep = step < TOTAL_QUESTION_STEPS;
  const question = isQuestionStep ? BEHAVIORAL_QUESTIONS[step] : null;

  return (
    <View>
      {/* Progress bar */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {step < ABOUT_STEP
            ? `Question ${step + 1} of ${TOTAL_QUESTION_STEPS}`
            : step === ABOUT_STEP
            ? "About the Patient"
            : "Almost Done"}
        </Text>
        {isQuestionStep && (
          <TouchableOpacity onPress={() => step > 0 && goToStep(step - 1)} disabled={step === 0}>
            <Ionicons name="chevron-back-circle-outline" size={20} color={step === 0 ? "#E2E8F0" : "#94A3B8"} />
          </TouchableOpacity>
        )}
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
        <Animated.View
          className="h-full rounded-full bg-blue-500"
          style={{
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["4%", "100%"] }),
          }}
        />
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        {/* ── Behavioral question card ─────────────────────────────── */}
        {question && (
          <View className="bg-white rounded-3xl border border-gray-100 p-6 items-center mb-6 shadow-sm">
            <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mb-4">
              <Ionicons name={QUESTION_ICONS[question.key]} size={30} color="#3b82f6" />
            </View>
            <Text className="text-center text-base font-semibold text-gray-800 leading-6 mb-6">
              {question.question}
            </Text>
            <View className="flex-row gap-3 w-full">
              <Bouncy style={{ flex: 1 }} onPress={() => answerQuestion(question.key, false)}>
                <View className="py-4 rounded-2xl items-center bg-gray-100">
                  <Text className="font-bold text-gray-600">No</Text>
                </View>
              </Bouncy>
              <Bouncy style={{ flex: 1 }} onPress={() => answerQuestion(question.key, true)}>
                <View className="py-4 rounded-2xl items-center bg-amber-500">
                  <Text className="font-bold text-white">Yes</Text>
                </View>
              </Bouncy>
            </View>
          </View>
        )}

        {/* ── About the patient ────────────────────────────────────── */}
        {step === ABOUT_STEP && (
          <View className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 shadow-sm">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1.5">Age</Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => set("age")(Math.max(40, (checklist.age ?? 75) - 1))}
                    className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold text-base">–</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-bold text-gray-800 w-10 text-center">{checklist.age ?? 75}</Text>
                  <TouchableOpacity
                    onPress={() => set("age")(Math.min(110, (checklist.age ?? 75) + 1))}
                    className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 font-bold text-base">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1.5">Gender</Text>
                <View className="flex-row gap-2">
                  {(["F", "M"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => set("gender")(g)}
                      className={`px-4 py-2 rounded-full ${checklist.gender === g ? "bg-blue-500" : "bg-gray-100"}`}
                    >
                      <Text className={`text-xs font-semibold ${checklist.gender === g ? "text-white" : "text-gray-500"}`}>
                        {g === "F" ? "Female" : "Male"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text className="text-xs text-gray-500 mb-1.5">Education Level</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {EDUCATION_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.value}
                  onPress={() => set("educationLevel")(lvl.value)}
                  className={`px-3 py-1.5 rounded-full ${
                    checklist.educationLevel === lvl.value ? "bg-blue-500" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      checklist.educationLevel === lvl.value ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {lvl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Bouncy onPress={() => goToStep(HISTORY_CHOICE_STEP)}>
              <View className="py-4 rounded-2xl items-center bg-blue-500">
                <Text className="font-bold text-white">Continue</Text>
              </View>
            </Bouncy>
          </View>
        )}

        {/* ── Skip or add medical history ──────────────────────────── */}
        {step === HISTORY_CHOICE_STEP && (
          <View className="bg-white rounded-3xl border border-gray-100 p-6 items-center mb-6 shadow-sm">
            <View className="w-16 h-16 rounded-2xl bg-purple-50 items-center justify-center mb-4">
              <Ionicons name="medical-outline" size={30} color="#8b5cf6" />
            </View>
            <Text className="text-center text-base font-semibold text-gray-800 mb-1">
              Add medical history?
            </Text>
            <Text className="text-center text-xs text-gray-500 mb-6">
              Optional — a few more details can improve accuracy.
            </Text>
            <View className="w-full gap-3">
              <Bouncy onPress={() => goToStep(HISTORY_DETAILS_STEP)}>
                <View className="py-4 rounded-2xl items-center bg-purple-500">
                  <Text className="font-bold text-white">Add Details</Text>
                </View>
              </Bouncy>
              <Bouncy onPress={() => onSubmit(checklist)} disabled={loading}>
                <View className="py-4 rounded-2xl items-center bg-gray-100 flex-row justify-center gap-2">
                  {loading ? (
                    <ActivityIndicator color="#475569" size="small" />
                  ) : (
                    <Text className="font-bold text-gray-600">Skip & Check Risk</Text>
                  )}
                </View>
              </Bouncy>
            </View>
          </View>
        )}

        {/* ── Medical history details ──────────────────────────────── */}
        {step === HISTORY_DETAILS_STEP && (
          <View className="mb-6">
            <View className="bg-white rounded-2xl border border-gray-100 px-4 mb-5 shadow-sm">
              <ToggleRow label="Smoking" value={!!checklist.smoking} onChange={set("smoking")} />
              {MEDICAL_HISTORY_QUESTIONS.map((q) => (
                <ToggleRow key={q.key} label={q.label} value={!!checklist[q.key]} onChange={set(q.key)} />
              ))}
            </View>
            <Bouncy onPress={() => onSubmit(checklist)} disabled={loading}>
              <View className={`py-4 rounded-2xl items-center flex-row justify-center gap-2 ${loading ? "bg-gray-300" : "bg-blue-500"}`}>
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-semibold text-base">Checking…</Text>
                  </>
                ) : (
                  <Text className="text-white font-semibold text-base">Check Risk Level</Text>
                )}
              </View>
            </Bouncy>
          </View>
        )}
      </Animated.View>
    </View>
  );
};
