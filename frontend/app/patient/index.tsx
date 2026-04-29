import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';

const Tasks = [
  { id: '1', title: 'Breakfast', time: '08:30 AM', subText: 'Milk and cereal', status: 'completed', icon: 'cafe' },
  { id: '2', title: 'Morning Pills', time: '09:15 AM', subText: 'Take 1 tablet', status: 'completed', icon: 'medkit', aiConfirmed: 'Medicine taken at 09:17 AM' },
  { id: '3', title: 'Morning Walk', time: '10:30 AM', subText: 'Around the garden', status: 'pending', icon: 'walk' },
  { id: '4', title: 'Lunch', time: '12:30 PM', subText: 'Rice with curry', status: 'pending', icon: 'restaurant' },
  { id: '5', title: 'Afternoon Rest', time: '02:00 PM', subText: 'Rest for 30 mins', status: 'pending', icon: 'time' },
];

export default function PatientScheduleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.todayText}>Today</Text>
          <Text style={styles.dateText}>Monday, Oct 21</Text>
        </View>
        <TouchableOpacity 
          style={styles.aiReadyBadge}
          onPress={() => router.push('/patient/ar-vision')}
        >
          <Text style={styles.aiReadyText}>AR VISION</Text>
          <View style={styles.pulseDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Tasks.map((task) => (
          <View key={task.id} style={styles.taskWrapper}>
            <TouchableOpacity style={[styles.taskCard, task.status === 'completed' && styles.completedCard]}>
              <View style={[styles.iconBox, { backgroundColor: task.status === 'completed' ? '#DCFCE7' : '#EFF6FF' }]}>
                <Ionicons name={task.icon as any} size={32} color={task.status === 'completed' ? '#16A34A' : '#3B82F6'} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTime}>{task.time}</Text>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSubText}>{task.subText}</Text>
              </View>
              <View style={[styles.statusIcon, { borderColor: task.status === 'completed' ? '#22C55E' : '#E2E8F0' }]}>
                {task.status === 'completed' ? (
                  <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                )}
              </View>
            </TouchableOpacity>
            
            {task.aiConfirmed && (
              <View style={styles.aiFeedback}>
                <View style={styles.aiIconSmall}>
                  <Text style={styles.aiLabel}>AI</Text>
                </View>
                <Text style={styles.aiFeedbackText}>Confirmed: {task.aiConfirmed}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity 
          style={styles.tracingBtn}
          onPress={() => router.push('/patient/ar-vision')}
        >
          <View style={styles.tracingBtnContent}>
            <Ionicons name="scan" size={32} color="#fff" />
            <Text style={styles.tracingBtnText}>Start Object Tracing</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.footerText}>You are all caught up!</Text>
      </ScrollView>

      {/* Bottom Navigation for Patient */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/patient')}
        >
           <View style={[styles.navIconBox, styles.activeNav]}>
              <Ionicons name="home" size={28} color={Colors.sageGreen} />
           </View>
           <Text style={[styles.navText, { color: Colors.sageGreen }]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/patient/memories')}
        >
           <View style={styles.navIconBox}>
              <Ionicons name="heart-outline" size={28} color="#475569" />
           </View>
           <Text style={styles.navText}>Memories</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 20,
  },
  todayText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#64748B',
  },
  aiReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  aiReadyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginRight: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  taskWrapper: {
    marginBottom: 15,
  },
  tracingBtn: {
    backgroundColor: Colors.sageGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 25,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: Colors.sageGreen,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tracingBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tracingBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 15,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 15,
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  taskSubText: {
    fontSize: 14,
    color: '#64748B',
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    marginTop: 8,
    marginLeft: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ECFCCB',
  },
  aiIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#65A30D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  aiFeedbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4D7C0F',
  },
  footerText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
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
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EF4444',
    marginTop: 4,
  }
});
