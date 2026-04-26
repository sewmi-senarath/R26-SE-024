import { Question } from '@/src/types/assessment.types';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  question: Question;
  onAnswer: (answers: string[]) => void;
}

export function SerialSubtractionRenderer({ question, onAnswer }: Props) {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<string[]>(['', '', '', '', '']);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const submitStep = () => {
    if (!inputVal.trim()) return;
    const updated = [...entries];
    updated[currentStep] = inputVal.trim();
    setEntries(updated);
    setInputVal('');

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
      onAnswer(updated);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="always"
        scrollEnabled={true}
      >
        <View className="px-6 gap-4 pb-8">
          <View className="bg-blue-50 rounded-2xl p-4">
            <Text className="text-center text-blue-700 font-semibold text-lg">
              Start from 100
            </Text>
            <Text className="text-center text-blue-500 text-sm mt-1">
              Subtract 10 each time
            </Text>
          </View>

          {/* Show all previous answers including current step answer */}
          <View className="gap-2">
            {entries.map((e, i) => (
              <View key={i} className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <Text className="text-gray-500 text-sm">Step {i + 1}</Text>
                <Text className="text-gray-800 font-medium">{e || '-'}</Text>
              </View>
            ))}
          </View>

          {/* Current input - only show if not complete */}
          {!isComplete && (
            <View className="gap-3 mt-4">
              <Text className="text-sm text-gray-500">Step {currentStep + 1} of 5</Text>
              <View className="flex-row gap-3">
                <TextInput
                  value={inputVal}
                  onChangeText={setInputVal}
                  keyboardType="number-pad"
                  placeholder="Enter answer"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                  autoFocus
                  onSubmitEditing={submitStep}
                />
                <TouchableOpacity
                  onPress={() => {
                    submitStep();
                    Keyboard.dismiss();
                  }}
                  disabled={!inputVal.trim()}
                  className={`rounded-xl px-5 py-3 justify-center ${
                    inputVal.trim() ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Completion message */}
          {isComplete && (
            <View className="bg-green-50 rounded-2xl p-4 mt-4">
              <Text className="text-center text-green-700 font-semibold">
                ✓ All steps completed!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}