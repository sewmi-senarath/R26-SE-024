import { Question } from '@/src/types/assessment.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function InstructionActionRenderer({ question, onAnswer }: Props) {
  const [userResponse, setUserResponse] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    setUserResponse(null);
  }, [question.id]);

  const handleCorrect = () => {
    setUserResponse('correct');
    onAnswer('correct');
  };

  const handleIncorrect = () => {
    setUserResponse('incorrect');
    onAnswer('incorrect');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="px-6 gap-6 pb-8">
        {/* Instruction Box */}
        <View className="bg-blue-50 rounded-2xl p-6">
          <Text className="text-center text-blue-700 font-semibold text-lg mb-4">
            {question.prompt}
          </Text>

          {/* Display subPrompt if available (like "CLOSE YOUR EYES") */}
          {question.subPrompt && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-blue-200">
              <Text className="text-center text-2xl font-bold text-blue-600">
                {question.subPrompt}
              </Text>
            </View>
          )}

          {/* Display instruction steps */}
          {question.instructionSteps && question.instructionSteps.length > 0 && (
            <View className="gap-3">
              {question.instructionSteps.map((step, index) => (
                <View key={index} className="flex-row items-start gap-3 bg-white rounded-xl p-3">
                  <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mt-1">
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-gray-700 text-base font-medium pt-1">
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Patient Action Indicator */}
        <View className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <Text className="text-center text-green-700 font-semibold">
            👁️ Patient is performing the action
          </Text>
          <Text className="text-center text-gray-600 text-sm mt-2">
            Observe and verify if the instruction was followed correctly
          </Text>
        </View>

        {/* Caregiver Verification Buttons */}
        <View className="gap-3 mt-6">
          <Text className="text-gray-700 font-semibold text-center text-base">
            Did the patient follow the instruction correctly?
          </Text>

          <TouchableOpacity
            onPress={handleCorrect}
            disabled={userResponse !== null}
            className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
              userResponse === 'correct'
                ? 'bg-green-500'
                : userResponse === 'incorrect'
                ? 'bg-gray-300'
                : 'bg-green-500'
            }`}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color="white" 
            />
            <Text className="text-white font-bold text-base">
              Yes, Correct
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleIncorrect}
            disabled={userResponse !== null}
            className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${
              userResponse === 'incorrect'
                ? 'bg-red-500'
                : userResponse === 'correct'
                ? 'bg-gray-300'
                : 'bg-red-500'
            }`}
          >
            <Ionicons 
              name="close-circle" 
              size={24} 
              color="white" 
            />
            <Text className="text-white font-bold text-base">
              No, Incorrect
            </Text>
          </TouchableOpacity>

          {/* Response Feedback
          {userResponse && (
            <View className={`rounded-2xl p-4 items-center mt-2 ${
              userResponse === 'correct' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Text className={`font-semibold text-base ${
                userResponse === 'correct' ? 'text-green-700' : 'text-red-700'
              }`}>
                {userResponse === 'correct' 
                  ? '✓ Response recorded as correct' 
                  : '✗ Response recorded as incorrect'}
              </Text>
            </View>
          )} */}
        </View>
      </View>
    </ScrollView>
  );
}