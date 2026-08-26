import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export interface AlbumPerson {
  name: string;
  emoji: string;
  image?: string;
  relation?: string;
}

interface Props {
  people: AlbumPerson[];
  /** "study" ends with a "ready" button that starts the game; "browse" loops for reminiscence. */
  mode: 'study' | 'browse';
  onDone: () => void;
  doneLabel?: string;
}

/**
 * A calm, auto-narrated slideshow of the people in a round. Doubles as (1) the
 * encoding/study step before medium & hard face-name rounds and (2) a
 * standalone, pressure-free reminiscence mode. No scoring, no wrong answers.
 */
export function FamilyAlbum({ people, mode, onDone, doneLabel }: Props) {
  const [index, setIndex] = useState(0);
  const person = people[index];
  const isLast = index === people.length - 1;

  // Gently narrate each face as it appears — "This is Nimal, your son".
  useEffect(() => {
    if (!person) return;
    const line = person.relation ? `This is ${person.name}, your ${person.relation}.` : `This is ${person.name}.`;
    Speech.stop();
    Speech.speak(line, { rate: 0.9 });
    return () => {
      Speech.stop();
    };
  }, [index, person]);

  if (!person) return null;

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : mode === 'browse' ? people.length - 1 : 0));
  const goNext = () => {
    if (isLast) {
      if (mode === 'browse') setIndex(0);
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 }}>
        <Animated.View key={index} entering={ZoomIn.duration(400).springify().damping(12)} style={{ alignItems: 'center', gap: 16 }}>
          {person.image ? (
            <Image
              source={{ uri: person.image }}
              style={{ width: 220, height: 220, borderRadius: 110, borderWidth: 5, borderColor: '#f3e8ff' }}
            />
          ) : (
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: '#faf5ff',
                borderWidth: 2,
                borderColor: '#e9d5ff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 100 }}>{person.emoji}</Text>
            </View>
          )}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text className="text-3xl font-extrabold text-gray-900">{person.name}</Text>
            {person.relation ? (
              <Text className="text-lg text-purple-500 font-semibold capitalize">Your {person.relation}</Text>
            ) : null}
          </View>
        </Animated.View>

        {/* progress dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {people.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? '#a855f7' : '#e9d5ff',
              }}
            />
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={goPrev}
            disabled={mode === 'study' && index === 0}
            activeOpacity={0.8}
            className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
              mode === 'study' && index === 0 ? 'bg-gray-100' : 'bg-white border border-gray-200'
            }`}
          >
            <Ionicons name="arrow-back" size={20} color={mode === 'study' && index === 0 ? '#9ca3af' : '#374151'} />
            <Text className={`font-semibold ${mode === 'study' && index === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            disabled={mode === 'study' && isLast}
            activeOpacity={0.8}
            className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center gap-2 ${
              mode === 'study' && isLast ? 'bg-gray-100' : 'bg-white border border-gray-200'
            }`}
          >
            <Text className={`font-semibold ${mode === 'study' && isLast ? 'text-gray-400' : 'text-gray-700'}`}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color={mode === 'study' && isLast ? '#9ca3af' : '#374151'} />
          </TouchableOpacity>
        </View>

        {(mode === 'browse' || isLast) && (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              onPress={() => {
                Speech.stop();
                onDone();
              }}
              activeOpacity={0.85}
              className="py-5 rounded-2xl items-center bg-purple-600"
            >
              <Text className="text-white text-lg font-bold">
                {doneLabel ?? (mode === 'study' ? "I'm ready" : 'Done')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
