import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// Short looping clip of an essential thing (medicine, glasses, keys ...) made by the
// AI service from the camera frames when it was saved - easier to recall than one photo.
export default function ClipPlayer({ url, height = 190 }: { url: string; height?: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={[s.wrap, { height }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <View style={s.badge}>
        <Text style={s.badgeText}>▶ අන්තිමට දැක්ක හැටි</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f172a', marginTop: 12 },
  badge: { position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
