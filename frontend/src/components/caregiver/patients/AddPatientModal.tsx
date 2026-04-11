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
import { PatientDetail } from '../../../types/caregiver.types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  age: string;
  condition: PatientDetail['condition'] | '';
  stage: string;
  condition_notes: string;
  condition_description: string;
}

interface FormErrors {
  name?: string;
  age?: string;
  condition?: string;
  stage?: string;
}

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (patient: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>) => void;
}

// ── Condition Options ────────────────────────────────────────────────────────
const CONDITIONS: PatientDetail['condition'][] = [
  'Mild', 'Moderate', 'Critical', 'Stable'
];

const conditionColors = {
  Mild:     { color: Colors.success, bg: Colors.successSoft },
  Moderate: { color: Colors.warning, bg: Colors.warningSoft },
  Critical: { color: Colors.danger,  bg: Colors.dangerSoft  },
  Stable:   { color: Colors.primary, bg: Colors.primaryLight },
};

// ── Helper ───────────────────────────────────────────────────────────────────
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const avatarColors = [
  '#4F8EF7', '#22C55E', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4',
];

// ── Component ────────────────────────────────────────────────────────────────
export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormData>({
    name: '',
    age: '',
    condition: '',
    stage: '',
    condition_notes: '',
    condition_description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Update a single field
  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Validate before submit
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim())      newErrors.name      = 'Patient name is required';
    if (!form.age.trim())       newErrors.age       = 'Age is required';
    else if (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)
                                newErrors.age       = 'Enter a valid age (1–120)';
    if (!form.condition)        newErrors.condition = 'Please select a condition';
    if (!form.stage.trim())     newErrors.stage     = 'Stage is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API call

    onSubmit({
      name:                    form.name.trim(),
      initials:                getInitials(form.name),
      age:                     Number(form.age),
      condition:               form.condition as PatientDetail['condition'],
      stage:                   form.stage.trim(),
      avatarColor:             avatarColors[Math.floor(Math.random() * avatarColors.length)],
      condition_notes:         form.condition_notes.trim() || 'No notes added',
      condition_description:   form.condition_description.trim() || 'No description provided.',
    });

    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setForm({
      name: '', age: '', condition: '',
      stage: '', condition_notes: '', condition_description: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Dark backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          {/* Stop backdrop tap from closing when tapping the sheet */}
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  maxHeight: '92%',
                  paddingBottom: Platform.OS === 'ios' ? 34 : 24,
                }}
              >
                {/* ── Handle bar ── */}
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
                      Add New Patient
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}
                    >
                      Fill in the patient details below
                    </Text>
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

                {/* ── Form ── */}
                <ScrollView
                  contentContainerStyle={{ padding: 20 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Basic Info Section */}
                  <Text
                    style={{
                      fontSize: 11, fontWeight: '700',
                      color: Colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 14,
                    }}
                  >
                    Basic Information
                  </Text>

                  <FormInput
                    label="Full Name"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={form.name}
                    onChangeText={(v) => setField('name', v)}
                    error={errors.name}
                    autoCapitalize="words"
                  />

                  <FormInput
                    label="Age"
                    required
                    placeholder="e.g. 82"
                    value={form.age}
                    onChangeText={(v) => setField('age', v)}
                    error={errors.age}
                    keyboardType="numeric"
                    maxLength={3}
                  />

                  {/* Condition Selector */}
                  <View className="mb-4">
                    <View className="flex-row mb-1.5">
                      <Text
                        style={{
                          fontSize: 11, fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: Colors.textSecondary,
                        }}
                      >
                        Condition
                      </Text>
                      <Text style={{ color: Colors.danger, marginLeft: 3 }}>*</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CONDITIONS.map((c) => {
                        const selected = form.condition === c;
                        const cfg = conditionColors[c];
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => setField('condition', c)}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 8,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: selected ? cfg.color : Colors.border,
                              backgroundColor: selected ? cfg.bg : Colors.white,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13, fontWeight: '600',
                                color: selected ? cfg.color : Colors.textMuted,
                              }}
                            >
                              {c}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errors.condition && (
                      <Text style={{ color: Colors.danger, fontSize: 12, marginTop: 6 }}>
                        {errors.condition}
                      </Text>
                    )}
                  </View>

                  <FormInput
                    label="Stage"
                    required
                    placeholder="e.g. Early, Moderate, Advanced"
                    value={form.stage}
                    onChangeText={(v) => setField('stage', v)}
                    error={errors.stage}
                    autoCapitalize="words"
                  />

                  {/* Divider */}
                  <View
                    style={{
                      height: 1, backgroundColor: Colors.borderLight,
                      marginVertical: 4, marginBottom: 16,
                    }}
                  />

                  {/* Medical Section */}
                  <Text
                    style={{
                      fontSize: 11, fontWeight: '700',
                      color: Colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 14,
                    }}
                  >
                    Medical Details (Optional)
                  </Text>

                  <FormInput
                    label="Diagnosis / Condition Name"
                    placeholder="e.g. Frontotemporal Dementia"
                    value={form.condition_notes}
                    onChangeText={(v) => setField('condition_notes', v)}
                    autoCapitalize="words"
                  />

                  <FormInput
                    label="Care Notes"
                    placeholder="e.g. Loves gardening. Needs gentle redirection..."
                    value={form.condition_description}
                    onChangeText={(v) => setField('condition_description', v)}
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: Colors.background,
                      borderWidth: 1.5,
                      borderColor: Colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      fontSize: 14,
                      color: Colors.textPrimary,
                      height: 90,
                      textAlignVertical: 'top',
                    }}
                  />

                  {/* ── Submit Button ── */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? Colors.primaryLight : Colors.primary,
                      borderRadius: 16,
                      height: 52,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8,
                      flexDirection: 'row',
                      gap: 8,
                    }}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={18} color={Colors.white} />
                        <Text
                          style={{
                            color: Colors.white,
                            fontWeight: '700',
                            fontSize: 15,
                          }}
                        >
                          Add Patient
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