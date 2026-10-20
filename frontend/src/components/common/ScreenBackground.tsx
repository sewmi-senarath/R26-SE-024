import { ReactNode } from 'react';
import { View } from 'react-native';

// Soft decorative circles behind screen content (no gradient dependency).
export default function ScreenBackground({ children, tint = '#EAF1FF' }: { children: ReactNode; tint?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFF', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: -120, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: tint }} />
      <View style={{ position: 'absolute', top: 160, left: -140, width: 260, height: 260, borderRadius: 130, backgroundColor: '#F1ECFF', opacity: 0.7 }} />
      <View style={{ position: 'absolute', bottom: -140, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E3F6F4', opacity: 0.8 }} />
      {children}
    </View>
  );
}
