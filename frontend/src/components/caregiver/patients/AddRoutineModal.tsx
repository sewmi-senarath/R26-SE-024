import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { FormInput } from './FormInput';
import { Routine } from '../../../types/caregiver.types';

// ── Time Presets ──────────────────────────────────────────────────────────────
const TIME_PRESETS = [
  { label: '🌅 Morning',   time: '08:00 AM' },
  { label: '☀️ Mid-Morning', time: '10:00 AM' },
  { label: '🍽️ Lunch',     time: '12:00 PM' },
  { label: '🌤️ Afternoon', time: '02:00 PM' },
  { label: '🌇 Evening',   time: '05:00 PM' },
  { label: '🌙 Night',     time: '08:00 PM' },
];

// ── Routine Suggestions ───────────────────────────────────────────────────────
const ROUTINE_SUGGESTIONS = [
  { label: '🥣 Breakfast',       value: 'Breakfast'         },
  { label: '💊 Medication',      value: 'Medication'        },
  { label: '🚶 Morning Walk',    value: 'Morning Walk'      },
  { label: '🛁 Bathing Assist',  value: 'Bathing Assist'    },
  { label: '🎵 Music Therapy',   value: 'Music Therapy'     },
  { label: '🌿 Garden Walk',     value: 'Garden Walk'       },
  { label: '🍽️ Lunch Feeding',   value: 'Lunch Feeding'     },
  { label: '😴 Afternoon Rest',  value: 'Afternoon Rest'    },
  { label: '🏋️ Physiotherapy',  value: 'Physiotherapy'     },
  { label: '📖 Reading Time',    value: 'Reading Time'      },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  title: string;
  time: string;
}

interface FormErrors {
  title?: string;
  time?: string;
}

interface AddRoutineModalProps {
  visible: boolean;
  patientName: string;
  onClose: () => void;
  onSubmit: (routine: Omit<Routine, 'id'>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  visible,
  patientName,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormData>({ title: '', time: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // ── Field updater ───────────────────────────────────────────────────────────
  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // ── Select a time preset ────────────────────────────────────────────────────
  const handleSelectPreset = (preset: { label: string; time: string }) => {
    setSelectedPreset(preset.time);
    setField('time', preset.time);
  };

  // ── Select a routine suggestion ─────────────────────────────────────────────
  const handleSelectSuggestion = (suggestion: { label: string; value: string }) => {
    setSelectedSuggestion(suggestion.value);
    setField('title', suggestion.value);
  };

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Routine name is required';
    if (!form.time.trim())  newErrors.time  = 'Please select or enter a time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    onSubmit({ title: form.title.trim(), time: form.time.trim(), completed: false });
    setLoading(false);
    handleClose();
  };

  // ── Close + reset ───────────────────────────────────────────────────────────
  const handleClose = () => {
    setForm({ title: '', time: '' });
    setErrors({});
    setSelectedPreset(null);
    setSelectedSuggestion(null);
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  maxHeight: '90%',
                  paddingBottom: Platform.OS === 'ios' ? 34 : 24,
                }}
              >
                {/* Handle bar */}
                <View
                  style={{
                    width: 40, height: 4, borderRadius: 2,
                    backgroundColor: Colors.border,
                    alignSelf: 'center',
                    marginTop: 12, marginBottom: 4,
                  }}
                />

                {/* ── Header ── */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.borderLight,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 18, fontWeight: '800',
                        color: Colors.textPrimary,
                      }}
                    >
                      Add Daily Routine
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 3,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={12}
                        color={Colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.primary,
                          fontWeight: '600',
                        }}
                      >
                        {patientName}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleClose}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: Colors.background,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* ── Form Body ── */}
                <ScrollView
                  contentContainerStyle={{ padding: 20 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >

                  {/* ── Routine Name ── */}
                  <Text
                    style={{
                      fontSize: 11, fontWeight: '700',
                      color: Colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 12,
                    }}
                  >
                    Routine Name
                  </Text>

                  {/* Suggestions chips */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {ROUTINE_SUGGESTIONS.map((s) => {
                      const selected = selectedSuggestion === s.value;
                      return (
                        <TouchableOpacity
                          key={s.value}
                          onPress={() => handleSelectSuggestion(s)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: selected ? Colors.primary : Colors.border,
                            backgroundColor: selected
                              ? Colors.primaryLight
                              : Colors.white,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: selected ? Colors.primary : Colors.textSecondary,
                            }}
                          >
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom name input */}
                  <FormInput
                    label="Or type a custom name"
                    required
                    placeholder="e.g. Evening Stretching"
                    value={form.title}
                    onChangeText={(v) => {
                      setSelectedSuggestion(null);
                      setField('title', v);
                    }}
                    error={errors.title}
                    autoCapitalize="words"
                  />

                  {/* Divider */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: Colors.borderLight,
                      marginBottom: 20,
                    }}
                  />

                  {/* ── Time ── */}
                  <Text
                    style={{
                      fontSize: 11, fontWeight: '700',
                      color: Colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 12,
                    }}
                  >
                    Time
                  </Text>

                  {/* Time preset chips */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {TIME_PRESETS.map((preset) => {
                      const selected = selectedPreset === preset.time;
                      return (
                        <TouchableOpacity
                          key={preset.time}
                          onPress={() => handleSelectPreset(preset)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: selected ? Colors.primary : Colors.border,
                            backgroundColor: selected
                              ? Colors.primaryLight
                              : Colors.white,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: selected ? Colors.primary : Colors.textSecondary,
                            }}
                          >
                            {preset.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 10,
                              color: selected ? Colors.primary : Colors.textMuted,
                              marginTop: 1,
                              textAlign: 'center',
                            }}
                          >
                            {preset.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom time input */}
                  <FormInput
                    label="Or enter custom time"
                    required
                    placeholder="e.g. 03:30 PM"
                    value={form.time}
                    onChangeText={(v) => {
                      setSelectedPreset(null);
                      setField('time', v);
                    }}
                    error={errors.time}
                    keyboardType="default"
                  />

                  {/* ── Preview Card ── */}
                  {(form.title || form.time) && (
                    <View
                      style={{
                        backgroundColor: Colors.primaryLight,
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: Colors.primary + '30',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 36, height: 36, borderRadius: 18,
                          backgroundColor: Colors.primary,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="time-outline" size={18} color={Colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13, fontWeight: '700',
                            color: Colors.textPrimary,
                          }}
                        >
                          {form.title || 'Routine name...'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12, color: Colors.primary,
                            marginTop: 2, fontWeight: '600',
                          }}
                        >
                          {form.time || 'Time not set'}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8, paddingVertical: 3,
                          borderRadius: 10,
                          backgroundColor: Colors.successSoft,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10, fontWeight: '700',
                            color: Colors.success,
                          }}
                        >
                          PREVIEW
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* ── Submit Button ── */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: loading
                        ? Colors.primaryLight
                        : Colors.primary,
                      borderRadius: 16,
                      height: 52,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
                        <Text
                          style={{
                            color: Colors.white,
                            fontWeight: '700',
                            fontSize: 15,
                          }}
                        >
                          Add Routine
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};