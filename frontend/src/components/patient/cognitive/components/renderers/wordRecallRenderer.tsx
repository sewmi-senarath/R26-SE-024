import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Question } from '@/src/types/assessment.types';

interface Props {
  question: Question;
  onAnswer: (recalled: string[]) => void;
}

export function WordRecallRenderer({ question, onAnswer }: Props) {
  const [phase, setPhase] = useState<'showing' | 'hidden'>('showing');

  // Hide words after 3 seconds, then patient recites them to clinician
  useEffect(() => {
    const timer = setTimeout(() => setPhase('hidden'), 3000);
    return () => clearTimeout(timer);
  }, []);

  // In assisted mode, clinician taps which words were recalled correctly
  const [recalled, setRecalled] = useState<Record<string, boolean>>({});

  const toggle = (word: string) => {
    const updated = { ...recalled, [word]: !recalled[word] };
    setRecalled(updated);
    const recalledWords = Object.entries(updated)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onAnswer(recalledWords);
  };

  return (
    <View className="px-6 gap-4">
      {phase === 'showing' ? (
        <View className="gap-3">
          <Text className="text-sm text-gray-500 text-center mb-2">
            Memorise these words
          </Text>
          {question.words?.map(word => (
            <View key={word} className="bg-blue-50 rounded-2xl p-5">
              <Text className="text-2xl font-semibold text-blue-700 text-center tracking-wide">
                {word}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-gray-500 text-center mb-2">
            Tap each word the patient recalled correctly
          </Text>
          {question.words?.map(word => {
            const isRecalled = recalled[word] ?? false;
            return (
              <TouchableOpacity
                key={word}
                onPress={() => toggle(word)}
                className={`p-4 rounded-2xl border ${
                  isRecalled ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-lg font-medium text-center ${isRecalled ? 'text-white' : 'text-gray-800'}`}>
                  {word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}