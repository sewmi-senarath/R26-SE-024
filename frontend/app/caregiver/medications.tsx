import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StatusBar,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { MedicationSearchBar } from '../../src/components/caregiver/more/medications/MedicationSearchBar';
import { MedicationCard } from '../../src/components/caregiver/more/medications/MedicationCard';
import { Medication, MedicationTime } from '../../src/types/caregiver.types';

// ── Filter tabs defined inline to fix layout ──────────────────────────────────
const TIME_TABS: { key: MedicationTime; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'morning',   label: 'Morning'   },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening',   label: 'Evening'   },
];

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1', name: 'Donepezil',
    dose: '10mg', form: 'Tablet',
    patientName: 'Eleanor Vance', patientInitials: 'EV', patientColor: '#4F8EF7',
    time: '08:00 AM', timeSlot: 'morning', status: 'taken', streak: 15,
  },
  {
    id: '2', name: 'Memantine',
    dose: '5mg', form: 'Capsule',
    patientName: 'Robert Chen', patientInitials: 'RC', patientColor: '#22C55E',
    time: '02:00 PM', timeSlot: 'afternoon', status: 'pending', streak: 5,
  },
  {
    id: '3', name: 'Rivastigmine',
    dose: '4.6mg/24hr', form: 'Patch',
    patientName: 'Margaret Hughes', patientInitials: 'MH', patientColor: '#F97316',
    time: '09:00 AM', timeSlot: 'morning', status: 'missed', streak: 0,
  },
  {
    id: '4', name: 'Sertraline',
    dose: '50mg', form: 'Tablet',
    patientName: 'Eleanor Vance', patientInitials: 'EV', patientColor: '#4F8EF7',
    time: '08:00 PM', timeSlot: 'evening', status: 'pending', streak: 30,
  },
  {
    id: '5', name: 'Quetiapine',
    dose: '25mg', form: 'Tablet',
    patientName: 'Arthur Pendelton', patientInitials: 'AP', patientColor: '#8B5CF6',
    time: '09:00 PM', timeSlot: 'evening', status: 'pending', streak: 8,
  },
];

const statusCycle: Record<string, Medication['status']> = {
  taken: 'pending', pending: 'taken', missed: 'taken',
};
// ─────────────────────────────────────────────────────────────────────────────

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>(MOCK_MEDICATIONS);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState<MedicationTime>('all');
  const [refreshing, setRefreshing]   = useState(false);

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    taken:   medications.filter((m) => m.status === 'taken').length,
    pending: medications.filter((m) => m.status === 'pending').length,
    missed:  medications.filter((m) => m.status === 'missed').length,
  }), [medications]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = medications;
    if (activeTab !== 'all') list = list.filter((m) => m.timeSlot === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.patientName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [medications, activeTab, search]);

  // ── Toggle status ───────────────────────────────────────────────────────────
  const handleToggleStatus = (id: string) => {
    setMedications((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: statusCycle[m.status] } : m,
      ),
    );
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
          paddingBottom: 12,
        }}
      >
        {/* Title row with back button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38, height: 38,
              borderRadius: 13,
              backgroundColor: Colors.white,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: Colors.borderLight,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: Colors.textPrimary,
            }}
          >
            Medications
          </Text>
        </View>

        {/* ── Status Summary Pills ── */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 20,
            marginBottom: 14,
          }}
        >
          {[
            { label: 'Taken',   count: counts.taken,   color: Colors.success, bg: Colors.successSoft  },
            { label: 'Pending', count: counts.pending, color: Colors.warning, bg: Colors.warningSoft  },
            { label: 'Missed',  count: counts.missed,  color: Colors.danger,  bg: Colors.dangerSoft   },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: item.bg,
                borderWidth: 1,
                borderColor: item.color + '30',
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: item.color,
                }}
              >
                {item.count}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: item.color,
                  marginTop: 2,
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Search Bar ── */}
        <MedicationSearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
        />

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            paddingBottom: 4,
          }}
        >
          {TIME_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? Colors.primary : Colors.white,
                  borderWidth: 1.5,
                  borderColor: isActive ? Colors.primary : Colors.border,
                  shadowColor: isActive ? Colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isActive ? 0.25 : 0,
                  shadowRadius: 6,
                  elevation: isActive ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: isActive ? Colors.white : Colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Medication List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 60 }}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💊</Text>
            <Text
              style={{
                fontSize: 16, fontWeight: '700',
                color: Colors.textPrimary, marginBottom: 6,
              }}
            >
              No medications found
            </Text>
            <Text
              style={{
                fontSize: 13, color: Colors.textMuted,
                textAlign: 'center', paddingHorizontal: 40,
              }}
            >
              Try a different filter or search term
            </Text>
          </View>
        ) : (
          filtered.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}