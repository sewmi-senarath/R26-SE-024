import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { MoodType } from '../../../types/caregiver.types';

const MOODS: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: 'awful', emoji: '😣', label: 'Awful',  color: Colors.danger  },
  { type: 'bad',   emoji: '😕', label: 'Bad',    color: Colors.accent  },
  { type: 'okay',  emoji: '😐', label: 'Okay',   color: Colors.warning },
  { type: 'good',  emoji: '🙂', label: 'Good',   color: Colors.primary },
  { type: 'great', emoji: '😄', label: 'Great',  color: Colors.success },
];

interface MoodCheckerProps {
  onMoodSelect?: (mood: MoodType) => void;
}

export const MoodChecker: React.FC<MoodCheckerProps> = ({ onMoodSelect }) => {
  const [selected, setSelected] = useState<MoodType | null>(null);

  const handleSelect = (mood: MoodType) => {
    setSelected(mood);
    onMoodSelect?.(mood);
  };

  const selectedMood = MOODS.find((m) => m.type === selected);

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <Text
        style={{
          fontSize: 16, fontWeight: '800',
          color: Colors.textPrimary, marginBottom: 4,
        }}
      >
        How are you feeling today?
      </Text>
      <Text
        style={{
          fontSize: 12, color: Colors.textMuted, marginBottom: 18,
        }}
      >
        Your mood helps us personalise your care recommendations
      </Text>

      {/* Mood buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: selected ? 16 : 0,
        }}
      >
        {MOODS.map((mood) => {
          const isSelected = selected === mood.type;
          return (
            <TouchableOpacity
              key={mood.type}
              onPress={() => handleSelect(mood.type)}
              activeOpacity={0.8}
              style={{
                alignItems: 'center',
                gap: 5,
              }}
            >
              {/* Emoji bubble */}
              <View
                style={{
                  width: 52, height: 52, borderRadius: 18,
                  backgroundColor: isSelected ? mood.color + '18' : Colors.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: isSelected ? 2 : 1.5,
                  borderColor: isSelected ? mood.color : Colors.border,
                  transform: [{ scale: isSelected ? 1.1 : 1 }],
                }}
              >
                <Text style={{ fontSize: 26 }}>{mood.emoji}</Text>
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? mood.color : Colors.textMuted,
                }}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback message after selection */}
      {selected && selectedMood && (
        <View
          style={{
            backgroundColor: selectedMood.color + '12',
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 20 }}>{selectedMood.emoji}</Text>
          <Text
            style={{
              fontSize: 12, fontWeight: '600',
              color: selectedMood.color, flex: 1,
            }}
          >
            {selected === 'great' || selected === 'good'
              ? "That's wonderful! Keep taking care of yourself. 💪"
              : selected === 'okay'
              ? "Hang in there! A short break might help. ☕"
              : "We hear you. Please consider taking a rest today. 🤍"}
          </Text>
        </View>
      )}
    </View>
  );
};
