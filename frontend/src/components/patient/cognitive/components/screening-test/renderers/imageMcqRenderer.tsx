import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Question } from '@/src/types/assessment.types';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function ImageMcqRenderer({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionLabel: string) => {
    setSelected(optionLabel);
    onAnswer(optionLabel);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="px-6 gap-6 pb-8">
        {/* Display Image */}
        {question.image && (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Image
              source={{ uri: question.image }}
              style={{ width: '100%', height: 250, borderRadius: 12 }}
              resizeMode="contain"
            />
            {question.imageDescription && (
              <Text className="text-sm text-gray-500 mt-2 text-center">
                {question.imageDescription}
              </Text>
            )}
          </View>
        )}

        {/* MCQ Options */}
        <View className="gap-3">
          {question.options?.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSelect(option.label)}
              activeOpacity={0.7}
            >
              <View
                className={`border-2 rounded-2xl px-4 py-4 flex-row items-center gap-3 ${
                  selected === option.label
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selected === option.label
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selected === option.label && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </View>
                <Text className={`text-base font-medium ${
                  selected === option.label ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}