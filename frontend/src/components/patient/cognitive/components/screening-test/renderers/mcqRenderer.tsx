import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Question } from '@/src/types/assessment.types';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function MCQRenderer({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionLabel: string) => {
    setSelected(optionLabel);
    onAnswer(optionLabel);
  };

  return (
    <View className="px-6 gap-3">
      {question.options?.map(opt => {
        const isSelected = selected === opt.label;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => handleSelect(opt.label)}
            className={`p-4 rounded-2xl border ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            <Text className={`text-base font-medium ${isSelected ? 'text-white' : 'text-gray-800'}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}