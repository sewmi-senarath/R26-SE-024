import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { getRecentUpdates } from '../../src/services/family/familyService';
import { CareUpdate, UpdateSeverity } from '../../src/types/family.types';

type Filter = 'all' | 'today' | 'week';

const severityConfig: Record<UpdateSeverity, { color: string; bg: string; label: string }> = {
  positive: { color: Colors.success, bg: Colors.successSoft, label: 'Positive' },
  info:     { color: Colors.primary, bg: Colors.primaryLight, label: 'Info' },
  warning:  { color: Colors.warning, bg: Colors.warningSoft, label: 'Attention' },
};

export default function UpdatesScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const updates: CareUpdate[] = getRecentUpdates();

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',   label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={{ backgroundColor: Colors.white, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.textPrimary }}>Care Updates</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>Daily care log from your care team</Text>
        </View>

        {/* Filter pills */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: filter === f.key ? Colors.primary : Colors.white, borderWidth: 1, borderColor: filter === f.key ? Colors.primary : Colors.border }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: filter === f.key ? '#fff' : Colors.textMuted }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Updates list */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          {updates.map((update, i) => {
            const sev = severityConfig[update.severity];
            return (
              <View key={update.id}>
                {i > 0 && <View style={{ height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 }} />}
                <View style={{ flexDirection: 'row', padding: 16, alignItems: 'flex-start' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: sev.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 }}>
                    <Ionicons name={update.icon as keyof typeof Ionicons.glyphMap} size={20} color={sev.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 }}>{update.title}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: sev.bg, marginLeft: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: sev.color }}>{sev.label}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 6 }}>{update.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                        <Text style={{ fontSize: 11, color: Colors.textMuted }}>{update.caregiverName}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                        <Text style={{ fontSize: 11, color: Colors.textMuted }}>{update.time}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}
