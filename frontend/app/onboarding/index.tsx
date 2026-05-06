import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'heart-outline' as const,
    color: '#ec4899',
    bg: '#fce7f3',
    title: 'Care with Compassion',
    description: 'MemoCare helps dementia patients live comfortably with personalized daily routines and reminders.',
  },
  {
    icon: 'people-outline' as const,
    color: '#3b82f6',
    bg: '#dbeafe',
    title: 'Stay Connected',
    description: 'Family members and caregivers can stay updated on their loved one\'s wellbeing anytime, anywhere.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    color: '#10b981',
    bg: '#d1fae5',
    title: 'Safe & Secure',
    description: 'Your data is protected. Role-based access ensures the right people see the right information.',
  },
];

export default function OnboardingIntro() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      // ✅ After last slide → go to role selection
      router.push('/role/select');
    }
  };

  const slide = slides[current];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      {/* Skip */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 56 }}>
        <TouchableOpacity onPress={() => router.push('/role/select')}>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* Icon */}
        <View style={{
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: slide.bg,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 48,
        }}>
          <Ionicons name={slide.icon} size={80} color={slide.color} />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 28, fontWeight: 'bold',
          color: '#1f2937', textAlign: 'center', marginBottom: 16,
        }}>
          {slide.title}
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: 16, color: '#6b7280',
          textAlign: 'center', lineHeight: 26,
        }}>
          {slide.description}
        </Text>
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 56 }}>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 }}>
          {slides.map((_, i) => (
            <View key={i} style={{
              width: i === current ? 28 : 8,
              height: 8, borderRadius: 4,
              backgroundColor: i === current ? '#2563eb' : '#e5e7eb',
            }} />
          ))}
        </View>

        {/* Next / Get Started */}
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: '#2563eb',
            paddingVertical: 16, borderRadius: 14,
            alignItems: 'center',
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {current === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}