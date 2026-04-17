import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { ProfileCard } from '../../src/components/caregiver/more/ProfileCard';
import { MenuSection } from '../../src/components/caregiver/more/MenuSection';
import { LogoutButton } from '../../src/components/caregiver/more/LogoutButton';
import { EditProfileModal } from '../../src/components/caregiver/more/profile/EditProfileModal';
import {
  CaregiverProfile,
  MenuItem,
  MenuSection as MenuSectionType,
} from '../../src/types/caregiver.types';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const INITIAL_PROFILE: CaregiverProfile = {
  name: 'Sarah Jenkins',
  role: 'Lead Caregiver',
  email: 'sarah.j@memocare.com',
  initials: 'SJ',
  avatarColor: Colors.primary,
  isOnline: true,
  shiftsCompleted: 124,
  patientsAssigned: 4,
  hoursThisWeek: 38,
};

const MENU_SECTIONS: MenuSectionType[] = [
  {
    title: 'Care Tools',
    items: [
      {
        id: 'medications',
        label: 'Medications',
        icon: 'medical-outline',
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
      },
      {
        id: 'wellbeing',
        label: 'Well-being',
        icon: 'heart-outline',
        iconColor: Colors.danger,
        iconBg: Colors.dangerSoft,
      },
      {
        id: 'alerts',
        label: 'Alerts & Notifications',
        icon: 'notifications-outline',
        iconColor: Colors.warning,
        iconBg: Colors.warningSoft,
        badge: 3,
        badgeColor: Colors.danger,
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: 'document-text-outline',
        iconColor: '#06B6D4',
        iconBg: '#ECFEFF',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings-outline',
        iconColor: Colors.textSecondary,
        iconBg: Colors.borderLight,
      },
      {
        id: 'privacy',
        label: 'Privacy & Security',
        icon: 'shield-checkmark-outline',
        iconColor: Colors.success,
        iconBg: Colors.successSoft,
      },
      {
        id: 'help',
        label: 'Help & Support',
        icon: 'help-circle-outline',
        iconColor: '#8B5CF6',
        iconBg: '#F5F3FF',
      },
    ],
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function MoreScreen() {
  const [profile, setProfile]           = useState<CaregiverProfile>(INITIAL_PROFILE);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // ── Navigate to sub-pages ───────────────────────────────────────────────────
  const handleMenuItemPress = (item: MenuItem) => {
    const routes: Record<string, string> = {
      medications: '/caregiver/medications',
      wellbeing:   '/caregiver/wellbeing',
      alerts:      '/caregiver/alerts',
      reports:     '/caregiver/reports',
    };

    if (routes[item.id]) {
      router.push(routes[item.id] as any);
    } else {
      // Settings, Privacy, Help — placeholder for now
      console.log('Navigate to:', item.id);
    }
  };

  // ── Open edit profile modal ─────────────────────────────────────────────────
  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  // ── Save updated profile ────────────────────────────────────────────────────
  const handleSaveProfile = (updated: Partial<CaregiverProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    console.log('Logged out');
    // TODO: clear auth token then:
    // router.replace('/auth/login');
  };

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Fixed Header ── */}
      <View
        style={{
          backgroundColor: Colors.background,
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: Colors.textPrimary,
          }}
        >
          More
        </Text>

        {/* App version badge */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: Colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: Colors.textMuted,
            }}
          >
            v1.0.0
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Profile Card ── */}
        <ProfileCard
          profile={profile}
          onEditPress={handleEditProfile}
        />

        {/* ── Menu Sections ── */}
        {MENU_SECTIONS.map((section) => (
          <MenuSection
            key={section.title}
            section={section}
            onItemPress={handleMenuItemPress}
          />
        ))}

        {/* ── Logout ── */}
        <LogoutButton onLogout={handleLogout} />

        {/* ── Footer ── */}
        <View style={{ alignItems: 'center', paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginBottom: 4,
            }}
          >
            <Ionicons name="heart" size={12} color={Colors.danger} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: Colors.textMuted,
              }}
            >
              MemoCare
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>
            Made with care for caregivers
          </Text>
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={editModalVisible}
        profile={profile}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}