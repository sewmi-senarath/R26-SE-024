import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { NotificationSummaryBar } from '../../src/components/caregiver/more/notifications/NotificationSummaryBar';
import { NotificationCard } from '../../src/components/caregiver/more/notifications/NotificationCard';
import { AppNotification, NotificationSeverity } from '../../src/types/caregiver.types';
import {
  fetchNotifications,
  acknowledgeNotification,
  acknowledgeAllNotifications,
} from '../../src/services/caregiver/Notificationservice';

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter]   = useState<NotificationSeverity | 'all'>('all');
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const real = await fetchNotifications();
      setNotifications(real);
    } catch (error) {
      console.log('Failed to load notifications:', error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadNotifications();
      setLoading(false);
    })();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const counts = useMemo(() => ({
    urgent:  notifications.filter((n) => n.severity === 'urgent'  && !n.acknowledged).length,
    warning: notifications.filter((n) => n.severity === 'warning' && !n.acknowledged).length,
    info:    notifications.filter((n) => n.severity === 'info'    && !n.acknowledged).length,
  }), [notifications]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.severity === activeFilter);
  }, [notifications, activeFilter]);

  const handleAcknowledge = async (id: string) => {
    // Update immediately so the UI feels responsive, then confirm with the server
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, acknowledged: true } : n),
    );
    try {
      await acknowledgeNotification(id);
    } catch (error) {
      console.log('Failed to acknowledge notification:', error);
    }
  };

  const handleAcknowledgeAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, acknowledged: true })));
    try {
      await acknowledgeAllNotifications();
    } catch (error) {
      console.log('Failed to acknowledge all notifications:', error);
    }
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

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 12 }}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
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
      )}
    </View>
  );
}