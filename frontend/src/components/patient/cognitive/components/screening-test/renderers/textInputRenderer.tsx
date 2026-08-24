import { Question } from '@/src/types/assessment.types';
import React, { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
}

export function TextInputRenderer({ question, onAnswer }: Props) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  // Reset when navigating between questions.
  useEffect(() => {
    setText('');
    setSaved(false);
  }, [question.id]);

  const save = () => {
    if (!text.trim()) return;
    onAnswer(text.trim());
    setSaved(true);
    Keyboard.dismiss();
  };

  return (
    <View className="px-6 gap-4">
      <View className="bg-blue-50 rounded-2xl p-4">
        <Text className="text-center text-blue-700 font-semibold text-base">
          {question.subPrompt || 'Write a complete sentence below'}
        </Text>
      </View>

      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (saved) setSaved(false);
        }}
        placeholder="Type your sentence here…"
        multiline
        textAlignVertical="top"
        className="border border-gray-300 rounded-2xl px-4 py-3 text-base bg-white"
        style={{ minHeight: 120 }}
        autoFocus
        onEndEditing={save}
      />

      <TouchableOpacity
        onPress={save}
        disabled={!text.trim()}
        className={`py-3 rounded-2xl items-center ${
          text.trim() ? 'bg-blue-500' : 'bg-gray-300'
        }`}
        activeOpacity={0.7}
      >
        <Text className="text-white font-semibold text-base">
          {saved ? 'Saved ✓' : 'Save sentence'}
        </Text>
      </TouchableOpacity>

      {saved && (
        <Text className="text-center text-green-600 text-sm">
          Sentence recorded. Tap “Next” to continue.
        </Text>
      )}
    </View>
  );
}
