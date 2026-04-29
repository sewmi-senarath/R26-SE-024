import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const { width, height } = Dimensions.get('window');

const ARLabel = ({ sinhala, english, icon, top, left }: any) => (
  <View style={[styles.labelContainer, { top, left }]}>
    <View style={styles.labelContent}>
       <View style={styles.labelIconBox}>
          <Ionicons name={icon} size={24} color={Colors.sageGreen} />
       </View>
       <View>
          <Text style={styles.sinhalaText}>{sinhala}</Text>
          <Text style={styles.englishText}>{english}</Text>
       </View>
    </View>
    <View style={styles.dot} />
  </View>
);

export default function ARVisionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.background}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Header Stats */}
          <View style={styles.header}>
             <View style={styles.glassStatus}>
                <Ionicons name="wifi" size={16} color={Colors.sageGreen} />
                <Text style={styles.statusText}>GLASS CONNECT | </Text>
                <Ionicons name="battery-charging" size={16} color={Colors.sageGreen} />
                <Text style={styles.statusText}> 84%</Text>
             </View>
             <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.back()}
            >
                <Ionicons name="person" size={20} color="#475569" />
             </TouchableOpacity>
          </View>

          {/* AR Labels */}
          <ARLabel sinhala="ඔරලෝසුව" english="CLOCK" icon="time" top="15%" left="40%" />
          <ARLabel sinhala="කෝප්පය" english="CUP" icon="cafe" top="45%" left="20%" />
          <ARLabel sinhala="දොර" english="DOOR" icon="exit" top="55%" left="55%" />

          <View style={styles.scanningIndicator}>
             <View style={[styles.corner, styles.topLeft]} />
             <View style={[styles.corner, styles.topRight]} />
             <View style={[styles.corner, styles.bottomLeft]} />
             <View style={[styles.corner, styles.bottomRight]} />
             <Text style={styles.scanningText}>SCANNING ENVIRONMENT</Text>
          </View>

          {/* Bottom Context */}
          <View style={styles.bottomSheet}>
             <View style={styles.contextBadge}>
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.contextText}>Looking at: Coffee Table</Text>
             </View>

             <View style={styles.bottomNav}>
                <TouchableOpacity 
                  style={[styles.navItem, styles.activeNav]}
                  onPress={() => router.push('/patient')}
                >
                   <Ionicons name="home" size={28} color="#fff" />
                   <Text style={[styles.navText, { color: '#fff' }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.navItem}
                  onPress={() => router.push('/patient/memories')}
                >
                   <Ionicons name="heart-outline" size={28} color="#475569" />
                   <Text style={styles.navText}>Memories</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.helpBtn}
                  onPress={() => router.push('/patient/voice-assistant')}
                >
                   <Ionicons name="alert-circle" size={32} color="#fff" />
                   <Text style={styles.helpBtnText}>HELP</Text>
                </TouchableOpacity>
             </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  glassStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  labelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 160,
  },
  labelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sageGreenSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sinhalaText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  englishText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sageGreen,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  scanningIndicator: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.sageGreen,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  contextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  bottomNav: {
    width: '100%',
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  activeNav: {
    backgroundColor: Colors.sageGreen,
    width: 80,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2,
  },
  helpBtn: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  helpBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  }
});
