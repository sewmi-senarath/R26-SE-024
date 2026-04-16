import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { NotificationSummaryBar } from '../../src/components/caregiver/more/notifications/NotificationSummaryBar';
import { NotificationCard } from '../../src/components/caregiver/more/notifications/NotificationCard';
import { AppNotification, NotificationSeverity } from '../../src/types/caregiver.types';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id:'1', patientName:'Margaret Hughes', message:'Missed morning Rivastigmine patch application.',        time:'10:15 AM', severity:'warning', acknowledged:false                                          },
  { id:'2', patientName:'Eleanor Vance',   message:'Increased pacing and agitation detected in common area.',time:'11:30 AM', severity:'urgent',  acknowledged:false, hasAction:true, actionLabel:'Take Action' },
  { id:'3', patientName:'System',          message:"You've been active for 4 hours. Consider a 15-min break.",time:'12:00 PM', severity:'info',    acknowledged:false                                          },
  { id:'4', patientName:'Robert Chen',     message:'Medication Memantine due in 30 minutes.',               time:'01:30 PM', severity:'warning', acknowledged:false                                          },
  { id:'5', patientName:'Arthur Pendelton',message:'Evening walk completed successfully.',                   time:'05:15 PM', severity:'info',    acknowledged:true                                           },
];

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter]   = useState<NotificationSeverity | 'all'>('all');
  const [refreshing, setRefreshing]       = useState(false);

  const counts = useMemo(() => ({
    urgent:  notifications.filter((n) => n.severity === 'urgent'  && !n.acknowledged).length,
    warning: notifications.filter((n) => n.severity === 'warning' && !n.acknowledged).length,
    info:    notifications.filter((n) => n.severity === 'info'    && !n.acknowledged).length,
  }), [notifications]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.severity === activeFilter);
  }, [notifications, activeFilter]);

  const handleAcknowledge = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, acknowledged: true } : n),
    );
  };

  const handleAcknowledgeAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, acknowledged: true })));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Notification Center</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Manage alerts and notifications</Text>
          </View>
          <TouchableOpacity
            onPress={handleAcknowledgeAll}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.primaryLight }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>All Read</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NotificationSummaryBar counts={counts} active={activeFilter} onPress={setActiveFilter} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {filtered.length === 0
          ? <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔔</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>All clear!</Text>
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4 }}>No notifications here</Text>
            </View>
          : filtered.map((notif) => (
              <NotificationCard key={notif.id} notification={notif} onAcknowledge={handleAcknowledge} />
            ))
        }
      </ScrollView>
    </View>
  );
}