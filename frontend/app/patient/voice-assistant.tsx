import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

const { width, height } = Dimensions.get('window');

export default function VoiceAssistantOverlay() {
  return (
    <View style={styles.container}>
      {/* Blurred background would go here in a real app */}
      <View style={styles.overlay}>
        <View style={styles.header}>
           <TouchableOpacity style={styles.volumeBtn}>
             <Ionicons name="volume-high" size={20} color="#fff" />
             <Text style={styles.volumeText}>Volume: High</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.closeBtn}>
             <Ionicons name="close" size={24} color="#fff" />
           </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.imageCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.profileImage}
            />
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>Your Grandson</Text>
            </View>
            <Text style={styles.nameText}>Kavindu</Text>
          </View>

          <View style={styles.messageBox}>
             <View style={styles.echoIconBox}>
                <Ionicons name="mic" size={24} color={Colors.sageGreen} />
             </View>
             <Text style={styles.echoLabel}>ECHOCARE VOICE</Text>
             <Text style={styles.mainMessage}>Time for your tea, Maduranga!</Text>
             
             <View style={styles.audioVisualizer}>
                <View style={[styles.bar, { height: 20 }]} />
                <View style={[styles.bar, { height: 40 }]} />
                <View style={[styles.bar, { height: 30 }]} />
                <View style={[styles.bar, { height: 50 }]} />
                <View style={[styles.bar, { height: 20 }]} />
                <Text style={styles.listeningText}>LISTENING</Text>
             </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Backdrop
  },
  overlay: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 60,
    left: 25,
    right: 25,
  },
  volumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  volumeText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  imageCard: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  labelBadge: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    backgroundColor: Colors.sageGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  labelText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  nameText: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  messageBox: {
    backgroundColor: '#fff',
    width: width * 0.85,
    borderRadius: 35,
    padding: 30,
    alignItems: 'flex-start',
  },
  echoIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.sageGreenSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  echoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
    marginBottom: 10,
  },
  mainMessage: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 40,
    marginBottom: 25,
  },
  audioVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 6,
    backgroundColor: Colors.sageGreen,
    borderRadius: 3,
  },
  listeningText: {
    marginLeft: 15,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.sageGreen,
    letterSpacing: 2,
  }
});
