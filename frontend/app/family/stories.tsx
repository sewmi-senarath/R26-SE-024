import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { getMemoryStories } from '../../src/services/family/familyService';

export default function StoriesScreen() {
  const stories = getMemoryStories();
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={{ backgroundColor: Colors.white, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Memory Stories</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>AI-narrated stories in a familiar voice</Text>
        </View>

        {/* Explainer card */}
        <View style={{ margin: 20, backgroundColor: Colors.purple + '15', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.purple + '30' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.purpleSoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              <Ionicons name="mic" size={22} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.purple, marginBottom: 4 }}>AI Voice Narration</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>Upload a photo and our system creates a personalised voice story narrated in a familiar family voice. Stories trigger mood improvements and enhance memory recall.</Text>
            </View>
          </View>
        </View>

        {/* Upload button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: Colors.purple, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
        >
          <Ionicons name="camera" size={22} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Upload Photo & Create Story</Text>
        </TouchableOpacity>

        {/* Stories list */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>YOUR STORIES</Text>
          {stories.map((story) => (
            <View key={story.id} style={{ backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: Colors.borderLight }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {/* Thumbnail placeholder */}
                <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.purpleSoft, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="images" size={26} color={Colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary, flex: 1 }}>{story.title}</Text>
                    {story.status === 'new' && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.primaryLight }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: Colors.primary }}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 4 }}>{story.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                      <Text style={{ fontSize: 11, color: Colors.textMuted }}>{story.duration}</Text>
                    </View>
                    {story.moodImpact && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="trending-up" size={11} color={Colors.success} />
                        <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '700' }}>+{story.moodImpact}% mood</Text>
                      </View>
                    )}
                  </View>
                </View>
                {/* Play button */}
                <TouchableOpacity
                  onPress={() => setPlaying(playing === story.id ? null : story.id)}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: playing === story.id ? Colors.success : Colors.purple, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name={playing === story.id ? 'pause' : 'play'} size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Playing indicator */}
              {playing === story.id && (
                <View style={{ marginTop: 12, backgroundColor: Colors.successSoft, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="volume-high" size={16} color={Colors.success} />
                  <Text style={{ fontSize: 12, color: Colors.success, fontWeight: '700' }}>Playing in Margaret's room...</Text>
                  <View style={{ flex: 1, height: 3, backgroundColor: Colors.success + '30', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ width: '45%', height: '100%', backgroundColor: Colors.success, borderRadius: 2 }} />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}
