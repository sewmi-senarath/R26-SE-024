import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { CaregiverTask } from '../../../types/caregiver.types';

const CATEGORIES = ['bathing', 'feeding', 'exercise', 'medication', 'outdoor', 'other'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

const MOCK_PATIENTS = [
  { id: '1', name: 'Eleanor Vance',   initials: 'EV', color: '#4F8EF7' },
  { id: '2', name: 'Robert Chen',     initials: 'RC', color: '#22C55E' },
  { id: '3', name: 'Maria Santos',    initials: 'MS', color: '#8B5CF6' },
  { id: '4', name: 'James Wilson',    initials: 'JW', color: '#EF4444' },
  { id: '5', name: 'Margaret Hughes', initials: 'MH', color: '#F97316' },
];

const categoryColor: Record<string, string> = {
  bathing: '#06B6D4', feeding: '#F97316', exercise: '#8B5CF6',
  medication: '#EF4444', outdoor: '#22C55E', other: '#94A3B8',
};
const priorityColor: Record<string, string> = {
  high: '#EF4444', medium: '#F97316', low: '#22C55E',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: CaregiverTask) => void;
}

export const AddTaskModal: React.FC<Props> = ({ visible, onClose, onAdd }) => {
  const [title, setTitle]       = useState('');
  const [patientId, setPatientId] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('other');
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('medium');
  const [time, setTime]         = useState('09:00 AM');
  const [showPatients, setShowPatients] = useState(false);

  const reset = () => {
    setTitle(''); setPatientId(''); setCategory('other');
    setPriority('medium'); setTime('09:00 AM'); setShowPatients(false);
  };

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === patientId);

  const handleAdd = () => {
    if (!title.trim() || !patientId) return;
    const patient = MOCK_PATIENTS.find((p) => p.id === patientId)!;
    const newTask: CaregiverTask = {
      id: Date.now().toString(),
      title: title.trim(),
      patientName: patient.name,
      patientInitials: patient.initials,
      patientColor: patient.color,
      time,
      status: 'todo',
      priority,
      assignee: 'SJ',
      category,
    };
    onAdd(newTask);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' }}
      >
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24, padding: 20,
          maxHeight: '92%',
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>Add new task</Text>
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>Fill in the task details below</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={labelStyle}>Task title</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Morning Bathing Assist"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Patient picker */}
            <Text style={labelStyle}>Patient</Text>
            <TouchableOpacity style={inputStyle} onPress={() => setShowPatients(!showPatients)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedPatient ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: selectedPatient.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 8, fontWeight: '800', color: selectedPatient.color }}>{selectedPatient.initials}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.textPrimary }}>{selectedPatient.name}</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: Colors.textMuted }}>Select patient</Text>
                )}
                <Ionicons name={showPatients ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
            {showPatients && (
              <View style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
                {MOCK_PATIENTS.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => { setPatientId(p.id); setShowPatients(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                      backgroundColor: patientId === p.id ? Colors.primaryLight : Colors.white,
                      borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: p.color }}>{p.initials}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.textPrimary, fontWeight: patientId === p.id ? '700' : '400' }}>{p.name}</Text>
                    {patientId === p.id && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Time */}
            <Text style={labelStyle}>Time</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 09:30 AM"
              placeholderTextColor={Colors.textMuted}
              value={time}
              onChangeText={setTime}
            />

            {/* Category */}
            <Text style={labelStyle}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const color = categoryColor[cat];
                return (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: isSelected ? color + '20' : Colors.borderLight,
                      borderWidth: isSelected ? 1.5 : 0.5,
                      borderColor: isSelected ? color : Colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? color : Colors.textSecondary, textTransform: 'capitalize' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority */}
            <Text style={labelStyle}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const color = priorityColor[p];
                return (
                  <TouchableOpacity key={p} onPress={() => setPriority(p)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: isSelected ? color + '18' : Colors.borderLight,
                      borderWidth: isSelected ? 1.5 : 0.5,
                      borderColor: isSelected ? color : Colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? color : Colors.textSecondary, textTransform: 'capitalize' }}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 8 }}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                backgroundColor: Colors.borderLight, borderWidth: 0.5, borderColor: Colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd}
              style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                backgroundColor: !title.trim() || !patientId ? Colors.border : Colors.primary }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.white }}>Add task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const labelStyle = {
  fontSize: 11, fontWeight: '700' as const, color: '#94A3B8',
  textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 6,
};
const inputStyle = {
  borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
  paddingHorizontal: 14, paddingVertical: 12,
  fontSize: 14, color: '#1E293B', marginBottom: 14,
  backgroundColor: '#F8FAFC',
};