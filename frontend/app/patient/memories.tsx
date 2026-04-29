import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const Memories = [
  { id: '1', name: 'Kavindu', relationship: 'Grandson', image: 'https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?q=80&w=400&auto=format&fit=crop', color: '#EEF4FF' },
  { id: '2', name: 'Amara', relationship: 'Daughter', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop', color: '#FDF2F2' },
  { id: '3', name: 'Saman', relationship: 'Son', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop', color: '#F0FDF4' },
  { id: '4', name: 'Leela', relationship: 'Wife', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=400&auto=format&fit=crop', color: '#FFFBEB' },
];

export default function MemoryVaultScreen() {
  const router = useRouter();

  const renderMemoryItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.memoryCard, { backgroundColor: item.color }]}>
      <Image source={{ uri: item.image }} style={styles.memoryImage} />
      <View style={styles.memoryInfo}>
        <Text style={styles.memoryName}>{item.name}</Text>
        <Text style={styles.memoryRelation}>{item.relationship}</Text>
      </View>
      <TouchableOpacity style={styles.playBtn}>
         <Ionicons name="play-circle" size={32} color={Colors.sageGreen} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Vault</Text>
        <Text style={styles.subtitle}>Your loved ones and favorite moments.</Text>
      </View>

      <FlatList
        data={Memories}
        renderItem={renderMemoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/patient')}
        >
           <View style={styles.navIconBox}>
              <Ionicons name="home-outline" size={28} color="#475569" />
           </View>
           <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/patient/memories')}
        >
           <View style={[styles.navIconBox, styles.activeNav]}>
              <Ionicons name="heart" size={28} color={Colors.sageGreen} />
           </View>
           <Text style={[styles.navText, { color: Colors.sageGreen }]}>Memories</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.helpBtn}
          onPress={() => router.push('/patient/voice-assistant')}
        >
           <View style={styles.helpIconBox}>
              <Ionicons name="alert-circle" size={32} color="#fff" />
           </View>
           <Text style={styles.helpText}>HELP</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  memoryCard: {
    width: '47%',
    borderRadius: 30,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  memoryImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    marginBottom: 12,
  },
  memoryInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  memoryName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  memoryRelation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  playBtn: {
    marginTop: 5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navIconBox: {
    padding: 10,
    borderRadius: 15,
  },
  activeNav: {
    backgroundColor: Colors.sageGreen + '15',
  },
  navText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  helpBtn: {
    alignItems: 'center',
  },
  helpIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EF4444',
    marginTop: 4,
  }
});
