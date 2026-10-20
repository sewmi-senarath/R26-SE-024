import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import PrimaryButton from '../../src/components/common/PrimaryButton';
import ScreenBackground from '../../src/components/common/ScreenBackground';

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
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const last = current === slides.length - 1;

  const handleNext = () => {
    if (!last) {
      listRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(current + 1);
    } else {
      router.push('/role/select');
    }
  };

  return (
    <ScreenBackground tint={slides[current].bg}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 56 }}>
        <TouchableOpacity onPress={() => router.push('/role/select')} hitSlop={12}>
          <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View style={{
              width: 220, height: 220, borderRadius: 110, backgroundColor: item.bg + '99',
              alignItems: 'center', justifyContent: 'center', marginBottom: 48,
            }}>
              <View style={{
                width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: item.color, shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.25, shadowRadius: 24, elevation: 8,
              }}>
                <Ionicons name={item.icon} size={72} color={item.color} />
              </View>
            </View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 14 }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 26 }}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={{ paddingHorizontal: 24, paddingBottom: 56 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 8 }}>
          {slides.map((s, i) => (
            <View key={s.title} style={{
              width: i === current ? 28 : 8, height: 8, borderRadius: 4,
              backgroundColor: i === current ? '#2563eb' : '#CBD5E1',
            }} />
          ))}
        </View>
        <PrimaryButton label={last ? 'Get Started' : 'Next'} onPress={handleNext} />
      </View>
    </ScreenBackground>
  );
}
