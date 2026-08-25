import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { CaregiverTask, PatientDetail } from '../../../types/caregiver.types';
import { createTask } from '../../../services/caregiver/taskService';
import { fetchPatients } from '../../../services/caregiver/patientService';

const CATEGORIES = ['bathing', 'feeding', 'exercise', 'medication', 'outdoor', 'other'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;



const categoryColor: Record<string, string> = {
  bathing: '#06B6D4', feeding: '#F97316', exercise: '#8B5CF6',
  medication: '#EF4444', outdoor: '#22C55E', other: '#94A3B8',
};
const priorityColor: Record<string, string> = {
  high: '#EF4444', medium: '#F97316', low: '#22C55E',
};


const deriveInitials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: CaregiverTask) => void;
  selectedDate: Date;
}

export const AddTaskModal: React.FC<Props> = ({
  visible, onClose, onAdd, selectedDate,
}) => {
  const [title, setTitle]           = useState('');
  const [patientId, setPatientId]   = useState('');
  const [category, setCategory]     = useState<typeof CATEGORIES[number]>('other');
  const [priority, setPriority]     = useState<typeof PRIORITIES[number]>('medium');
  const [time, setTime]             = useState('09:00 AM');
  const [showPatients, setShowPatients] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  //  Real patient list state 
  const [patients, setPatients]             = useState<PatientDetail[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError]     = useState<string | null>(null);
  const [patientQuery, setPatientQuery]     = useState('');

  const reset = () => {
    setTitle(''); setPatientId(''); setCategory('other');
    setPriority('medium'); setTime('09:00 AM'); setShowPatients(false);
    setPatientQuery('');
  };


  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingPatients(true);
        setPatientError(null);
        const list = await fetchPatients();
        if (!cancelled) setPatients(list);
      } catch (error) {
        console.error('Failed to load patients:', error);
        if (!cancelled) setPatientError('Could not load your patients.');
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    })();

  
    return () => { cancelled = true; };
  }, [visible]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  // Type-to-filter suggestions 
  const visiblePatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, patientQuery]);

  // Only worth showing the search box once the list is long enough to scroll.
  const showSearch = patients.length > 5;

  const handleAdd = async () => {
    if (!title.trim() || !patientId) return;

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      Alert.alert('Error', 'That patient is no longer available. Please pick again.');
      setPatientId('');
      return;
    }


    const taskPayload = {
      title:           title.trim(),
      patientId:       patient.id,
      patientName:     patient.name,
      patientInitials: patient.initials || deriveInitials(patient.name),
      patientColor:    patient.avatarColor || '#4F8EF7',
      time,
      status:          'todo',
      priority,
      assignee:        'SJ',
      category,
    } as Omit<CaregiverTask, 'id'>;

    try {
      setSubmitting(true);
      const savedTask = await createTask(taskPayload, selectedDate);
      onAdd(savedTask);
      reset();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dropdown body: loading / error / empty / list ──────────────────────
  const renderPatientOptions = () => {
    if (loadingPatients) {
      return (
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 8, paddingVertical: 20,
        }}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={{ fontSize: 13, color: Colors.textMuted }}>
            Loading patients...
          </Text>
        </View>
      );
    }

    if (patientError) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 18, gap: 8 }}>
          <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>
            {patientError}
          </Text>
          <TouchableOpacity
            onPress={() => { setPatients([]); setPatientError(null); setShowPatients(false); setTimeout(() => setShowPatients(true), 0); }}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
              backgroundColor: Colors.primaryLight,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (patients.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 }}>
          <Ionicons name="people-outline" size={22} color={Colors.textMuted} />
          <Text style={{
            fontSize: 13, color: Colors.textMuted,
            textAlign: 'center', marginTop: 6,
          }}>
            No patients registered yet.{'\n'}Add a patient from the Patients tab first.
          </Text>
        </View>
      );
    }

    if (visiblePatients.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 18 }}>
          <Text style={{ fontSize: 13, color: Colors.textMuted }}>
            No patient matches "{patientQuery.trim()}"
          </Text>
        </View>
      );
    }

    return visiblePatients.map((p) => {
      const initials = p.initials || deriveInitials(p.name);
      const color    = p.avatarColor || '#4F8EF7';
      const isPicked = patientId === p.id;

      return (
        <TouchableOpacity
          key={p.id}
          onPress={() => { setPatientId(p.id); setShowPatients(false); setPatientQuery(''); }}
          style={{
            flexDirection: 'row', alignItems: 'center',
            gap: 10, padding: 12,
            backgroundColor: isPicked ? Colors.primaryLight : Colors.white,
            borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
          }}
        >
          <View style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: color + '22',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color }}>
              {initials}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 14, color: Colors.textPrimary,
              fontWeight: isPicked ? '700' : '400',
            }}>
              {p.name}
            </Text>
            {!!p.condition && (
              <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 1 }}>
                {p.condition}{p.age ? ` \u00B7 ${p.age} yrs` : ''}
              </Text>
            )}
          </View>

          {isPicked && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
      );
    });
  };

  const canSubmit = !!title.trim() && !!patientId && !submitting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' }}
      >
        <View style={{
          backgroundColor: Colors.white, borderRadius: 24,
          padding: 20, maxHeight: '92%',
        }}>
          {/* Handle */}
          <View style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: Colors.borderLight,
            alignSelf: 'center', marginBottom: 16,
          }} />

          {/* Header */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20,
          }}>
            <View>
              <Text style={{
                fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
              }}>
                Add new task
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>
                Fill in the task details below
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { reset(); onClose(); }}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: Colors.borderLight,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <TouchableOpacity
              style={inputStyle}
              onPress={() => setShowPatients(!showPatients)}
            >
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {selectedPatient ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: (selectedPatient.avatarColor || '#4F8EF7') + '22',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontSize: 8, fontWeight: '800',
                        color: selectedPatient.avatarColor || '#4F8EF7',
                      }}>
                        {selectedPatient.initials || deriveInitials(selectedPatient.name)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: Colors.textPrimary }}>
                      {selectedPatient.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: Colors.textMuted }}>
                    {loadingPatients ? 'Loading patients...' : 'Select patient'}
                  </Text>
                )}
                <Ionicons
                  name={showPatients ? 'chevron-up' : 'chevron-down'}
                  size={16} color={Colors.textMuted}
                />
              </View>
            </TouchableOpacity>

            {showPatients && (
              <View style={{
                borderWidth: 1, borderColor: Colors.border,
                borderRadius: 12, marginBottom: 14, overflow: 'hidden',
              }}>
                {showSearch && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
                    backgroundColor: '#F8FAFC',
                  }}>
                    <Ionicons name="search" size={14} color={Colors.textMuted} />
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: Colors.textPrimary, padding: 0 }}
                      placeholder="Search patients..."
                      placeholderTextColor={Colors.textMuted}
                      value={patientQuery}
                      onChangeText={setPatientQuery}
                      autoCorrect={false}
                    />
                    {!!patientQuery && (
                      <TouchableOpacity onPress={() => setPatientQuery('')}>
                        <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {renderPatientOptions()}
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
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14,
            }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const color = categoryColor[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: isSelected ? color + '20' : Colors.borderLight,
                      borderWidth: isSelected ? 1.5 : 0.5,
                      borderColor: isSelected ? color : Colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? color : Colors.textSecondary,
                      textTransform: 'capitalize',
                    }}>
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
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: isSelected ? color + '18' : Colors.borderLight,
                      borderWidth: isSelected ? 1.5 : 0.5,
                      borderColor: isSelected ? color : Colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? color : Colors.textSecondary,
                      textTransform: 'capitalize',
                    }}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={() => { reset(); onClose(); }}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 14,
                alignItems: 'center', backgroundColor: Colors.borderLight,
                borderWidth: 0.5, borderColor: Colors.border,
              }}
            >
              <Text style={{
                fontSize: 14, fontWeight: '700', color: Colors.textSecondary,
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!canSubmit}
              style={{
                flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                backgroundColor: canSubmit ? Colors.primary : Colors.border,
              }}
            >
              <Text style={{
                fontSize: 14, fontWeight: '700', color: Colors.white,
              }}>
                {submitting ? 'Saving...' : 'Add task'}
              </Text>
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