// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   Modal,
//   TouchableOpacity,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   TouchableWithoutFeedback,
//   ActivityIndicator,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../../../constants/colors';
// import { FormInput } from './FormInput';
// import { PatientDetail } from '../../../types/caregiver.types';

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface FormData {
//   name: string;
//   age: string;
//   condition: PatientDetail['condition'] | '';
//   stage: string;
//   condition_notes: string;
//   condition_description: string;
// }

// interface FormErrors {
//   name?: string;
//   age?: string;
//   condition?: string;
//   stage?: string;
// }

// interface AddPatientModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSubmit: (patient: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>) => void;
// }

// // ── Condition Options ────────────────────────────────────────────────────────
// const CONDITIONS: PatientDetail['condition'][] = [
//   'Mild', 'Moderate', 'Critical', 'Stable'
// ];

// const conditionColors = {
//   Mild:     { color: Colors.success, bg: Colors.successSoft },
//   Moderate: { color: Colors.warning, bg: Colors.warningSoft },
//   Critical: { color: Colors.danger,  bg: Colors.dangerSoft  },
//   Stable:   { color: Colors.primary, bg: Colors.primaryLight },
// };

// // ── Helper ───────────────────────────────────────────────────────────────────
// const getInitials = (name: string): string => {
//   return name
//     .split(' ')
//     .map((n) => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);
// };

// const avatarColors = [
//   '#4F8EF7', '#22C55E', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4',
// ];

// // ── Component ────────────────────────────────────────────────────────────────
// export const AddPatientModal: React.FC<AddPatientModalProps> = ({
//   visible,
//   onClose,
//   onSubmit,
// }) => {
//   const [form, setForm] = useState<FormData>({
//     name: '',
//     age: '',
//     condition: '',
//     stage: '',
//     condition_notes: '',
//     condition_description: '',
//   });
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [loading, setLoading] = useState(false);

//   // Update a single field
//   const setField = (key: keyof FormData, value: string) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//     if (errors[key as keyof FormErrors]) {
//       setErrors((prev) => ({ ...prev, [key]: undefined }));
//     }
//   };

//   // Validate before submit
//   const validate = (): boolean => {
//     const newErrors: FormErrors = {};
//     if (!form.name.trim())      newErrors.name      = 'Patient name is required';
//     if (!form.age.trim())       newErrors.age       = 'Age is required';
//     else if (isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)
//                                 newErrors.age       = 'Enter a valid age (1–120)';
//     if (!form.condition)        newErrors.condition = 'Please select a condition';
//     if (!form.stage.trim())     newErrors.stage     = 'Stage is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validate()) return;

//     setLoading(true);
//     await new Promise((r) => setTimeout(r, 800)); // simulate API call

//     onSubmit({
//       name:                    form.name.trim(),
//       initials:                getInitials(form.name),
//       age:                     Number(form.age),
//       condition:               form.condition as PatientDetail['condition'],
//       stage:                   form.stage.trim(),
//       avatarColor:             avatarColors[Math.floor(Math.random() * avatarColors.length)],
//       condition_notes:         form.condition_notes.trim() || 'No notes added',
//       condition_description:   form.condition_description.trim() || 'No description provided.',
//     });

//     setLoading(false);
//     handleClose();
//   };

//   const handleClose = () => {
//     setForm({
//       name: '', age: '', condition: '',
//       stage: '', condition_notes: '', condition_description: '',
//     });
//     setErrors({});
//     onClose();
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       transparent
//       onRequestClose={handleClose}
//     >
//       {/* Dark backdrop */}
//       <TouchableWithoutFeedback onPress={handleClose}>
//         <View
//           style={{
//             flex: 1,
//             backgroundColor: 'rgba(15, 23, 42, 0.5)',
//             justifyContent: 'flex-end',
//           }}
//         >
//           {/* Stop backdrop tap from closing when tapping the sheet */}
//           <TouchableWithoutFeedback>
//             <KeyboardAvoidingView
//               behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             >
//               <View
//                 style={{
//                   backgroundColor: Colors.white,
//                   borderTopLeftRadius: 28,
//                   borderTopRightRadius: 28,
//                   maxHeight: '92%',
//                   paddingBottom: Platform.OS === 'ios' ? 34 : 24,
//                 }}
//               >
//                 {/* ── Handle bar ── */}
//                 <View
//                   style={{
//                     width: 40, height: 4, borderRadius: 2,
//                     backgroundColor: Colors.border,
//                     alignSelf: 'center',
//                     marginTop: 12, marginBottom: 4,
//                   }}
//                 />

//                 {/* ── Header ── */}
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     paddingHorizontal: 20,
//                     paddingVertical: 16,
//                     borderBottomWidth: 1,
//                     borderBottomColor: Colors.borderLight,
//                   }}
//                 >
//                   <View>
//                     <Text
//                       style={{
//                         fontSize: 18, fontWeight: '800',
//                         color: Colors.textPrimary,
//                       }}
//                     >
//                       Add New Patient
//                     </Text>
//                     <Text
//                       style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}
//                     >
//                       Fill in the patient details below
//                     </Text>
//                   </View>
//                   <TouchableOpacity
//                     onPress={handleClose}
//                     style={{
//                       width: 36, height: 36, borderRadius: 18,
//                       backgroundColor: Colors.background,
//                       alignItems: 'center', justifyContent: 'center',
//                     }}
//                   >
//                     <Ionicons name="close" size={18} color={Colors.textSecondary} />
//                   </TouchableOpacity>
//                 </View>

//                 {/* ── Form ── */}
//                 <ScrollView
//                   contentContainerStyle={{ padding: 20 }}
//                   showsVerticalScrollIndicator={false}
//                   keyboardShouldPersistTaps="handled"
//                 >
//                   {/* Basic Info Section */}
//                   <Text
//                     style={{
//                       fontSize: 11, fontWeight: '700',
//                       color: Colors.textMuted,
//                       textTransform: 'uppercase',
//                       letterSpacing: 1,
//                       marginBottom: 14,
//                     }}
//                   >
//                     Basic Information
//                   </Text>

//                   <FormInput
//                     label="Full Name"
//                     required
//                     placeholder="e.g. Eleanor Vance"
//                     value={form.name}
//                     onChangeText={(v) => setField('name', v)}
//                     error={errors.name}
//                     autoCapitalize="words"
//                   />

//                   <FormInput
//                     label="Age"
//                     required
//                     placeholder="e.g. 82"
//                     value={form.age}
//                     onChangeText={(v) => setField('age', v)}
//                     error={errors.age}
//                     keyboardType="numeric"
//                     maxLength={3}
//                   />

//                   {/* Condition Selector */}
//                   <View className="mb-4">
//                     <View className="flex-row mb-1.5">
//                       <Text
//                         style={{
//                           fontSize: 11, fontWeight: '600',
//                           textTransform: 'uppercase',
//                           letterSpacing: 0.5,
//                           color: Colors.textSecondary,
//                         }}
//                       >
//                         Condition
//                       </Text>
//                       <Text style={{ color: Colors.danger, marginLeft: 3 }}>*</Text>
//                     </View>
//                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
//                       {CONDITIONS.map((c) => {
//                         const selected = form.condition === c;
//                         const cfg = conditionColors[c];
//                         return (
//                           <TouchableOpacity
//                             key={c}
//                             onPress={() => setField('condition', c)}
//                             style={{
//                               paddingHorizontal: 16, paddingVertical: 8,
//                               borderRadius: 20,
//                               borderWidth: 1.5,
//                               borderColor: selected ? cfg.color : Colors.border,
//                               backgroundColor: selected ? cfg.bg : Colors.white,
//                             }}
//                           >
//                             <Text
//                               style={{
//                                 fontSize: 13, fontWeight: '600',
//                                 color: selected ? cfg.color : Colors.textMuted,
//                               }}
//                             >
//                               {c}
//                             </Text>
//                           </TouchableOpacity>
//                         );
//                       })}
//                     </View>
//                     {errors.condition && (
//                       <Text style={{ color: Colors.danger, fontSize: 12, marginTop: 6 }}>
//                         {errors.condition}
//                       </Text>
//                     )}
//                   </View>

//                   <FormInput
//                     label="Stage"
//                     required
//                     placeholder="e.g. Early, Moderate, Advanced"
//                     value={form.stage}
//                     onChangeText={(v) => setField('stage', v)}
//                     error={errors.stage}
//                     autoCapitalize="words"
//                   />

//                   {/* Divider */}
//                   <View
//                     style={{
//                       height: 1, backgroundColor: Colors.borderLight,
//                       marginVertical: 4, marginBottom: 16,
//                     }}
//                   />

//                   {/* Medical Section */}
//                   <Text
//                     style={{
//                       fontSize: 11, fontWeight: '700',
//                       color: Colors.textMuted,
//                       textTransform: 'uppercase',
//                       letterSpacing: 1,
//                       marginBottom: 14,
//                     }}
//                   >
//                     Medical Details (Optional)
//                   </Text>

//                   <FormInput
//                     label="Diagnosis / Condition Name"
//                     placeholder="e.g. Frontotemporal Dementia"
//                     value={form.condition_notes}
//                     onChangeText={(v) => setField('condition_notes', v)}
//                     autoCapitalize="words"
//                   />

//                   <FormInput
//                     label="Care Notes"
//                     placeholder="e.g. Loves gardening. Needs gentle redirection..."
//                     value={form.condition_description}
//                     onChangeText={(v) => setField('condition_description', v)}
//                     multiline
//                     numberOfLines={3}
//                     style={{
//                       backgroundColor: Colors.background,
//                       borderWidth: 1.5,
//                       borderColor: Colors.border,
//                       borderRadius: 12,
//                       paddingHorizontal: 14,
//                       paddingVertical: 11,
//                       fontSize: 14,
//                       color: Colors.textPrimary,
//                       height: 90,
//                       textAlignVertical: 'top',
//                     }}
//                   />

//                   {/* ── Submit Button ── */}
//                   <TouchableOpacity
//                     onPress={handleSubmit}
//                     disabled={loading}
//                     style={{
//                       backgroundColor: loading ? Colors.primaryLight : Colors.primary,
//                       borderRadius: 16,
//                       height: 52,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       marginTop: 8,
//                       flexDirection: 'row',
//                       gap: 8,
//                     }}
//                     activeOpacity={0.85}
//                   >
//                     {loading ? (
//                       <ActivityIndicator color={Colors.primary} size="small" />
//                     ) : (
//                       <>
//                         <Ionicons name="person-add-outline" size={18} color={Colors.white} />
//                         <Text
//                           style={{
//                             color: Colors.white,
//                             fontWeight: '700',
//                             fontSize: 15,
//                           }}
//                         >
//                           Add Patient
//                         </Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 </ScrollView>
//               </View>
//             </KeyboardAvoidingView>
//           </TouchableWithoutFeedback>
//         </View>
//       </TouchableWithoutFeedback>
//     </Modal>
//   );
// };

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { fetchRegisteredPatients } from '../../../services/caregiver/patientService';
import { PatientDetail } from '../../../types/caregiver.types';
import { FormInput } from './FormInput';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  userId:                string;
  name:                  string;
  age:                   string;
  condition:             PatientDetail['condition'] | '';
  stage:                 string;
  condition_notes:       string;
  condition_description: string;
}

interface FormErrors {
  name?:      string;
  age?:       string;
  condition?: string;
  stage?:     string;
}

interface RegisteredPatient {
  id:       string;
  fullName: string;
  email:    string;
}

interface AddPatientModalProps {
  visible:  boolean;
  onClose:  () => void;
  onSubmit: (patient: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CONDITIONS: PatientDetail['condition'][] = [
  'Mild', 'Moderate', 'Critical', 'Stable',
];

const conditionColors = {
  Mild:     { color: Colors.success, bg: Colors.successSoft },
  Moderate: { color: Colors.warning, bg: Colors.warningSoft },
  Critical: { color: Colors.danger,  bg: Colors.dangerSoft  },
  Stable:   { color: Colors.primary, bg: Colors.primaryLight },
};

const avatarColors = [
  '#4F8EF7', '#22C55E', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4',
];

const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

// ── Component ─────────────────────────────────────────────────────────────────
export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormData>({
    userId: '', name: '', age: '', condition: '',
    stage: '', condition_notes: '', condition_description: '',
  });
  const [errors, setErrors]                         = useState<FormErrors>({});
  const [loading, setLoading]                       = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>([]);
  const [loadingPatients, setLoadingPatients]       = useState(false);
  const [dropdownOpen, setDropdownOpen]             = useState(false);

  // ✅ Load registered patients when modal opens
  useEffect(() => {
    if (visible) {
      loadRegisteredPatients();
    }
  }, [visible]);

  const loadRegisteredPatients = async () => {
    setLoadingPatients(true);
    try {
      const patients = await fetchRegisteredPatients();
      setRegisteredPatients(patients);
    } catch (error) {
      console.log('Failed to load patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // ✅ Select patient from dropdown
  const handleSelectPatient = (patient: RegisteredPatient) => {
    setForm((prev) => ({
      ...prev,
      userId: patient.id,
      name:   patient.fullName,
    }));
    setDropdownOpen(false);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim())  newErrors.name      = 'Please select a patient';
    if (!form.age.trim())   newErrors.age       = 'Age is required';
    else if (
      isNaN(Number(form.age)) ||
      Number(form.age) < 1   ||
      Number(form.age) > 120
    )                       newErrors.age       = 'Enter a valid age (1–120)';
    if (!form.condition)    newErrors.condition = 'Please select a condition';
    if (!form.stage.trim()) newErrors.stage     = 'Stage is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        name:                  form.name.trim(),
        initials:              getInitials(form.name),
        age:                   Number(form.age),
        condition:             form.condition as PatientDetail['condition'],
        stage:                 form.stage.trim(),
        avatarColor:           avatarColors[Math.floor(Math.random() * avatarColors.length)],
        condition_notes:       form.condition_notes.trim() || 'No notes added',
        condition_description: form.condition_description.trim() || 'No description provided.',
      });
      handleClose();
    } catch (error) {
      // handled in patients.tsx
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      userId: '', name: '', age: '', condition: '',
      stage: '', condition_notes: '', condition_description: '',
    });
    setErrors({});
    setDropdownOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={{
                backgroundColor: Colors.white,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: '92%',
                paddingBottom: Platform.OS === 'ios' ? 34 : 24,
              }}>

                {/* Handle bar */}
                <View style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: Colors.border,
                  alignSelf: 'center',
                  marginTop: 12, marginBottom: 4,
                }} />

                {/* Header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.borderLight,
                }}>
                  <View>
                    <Text style={{
                      fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
                    }}>
                      Add New Patient
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
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

                {/* Form */}
                <ScrollView
                  contentContainerStyle={{ padding: 20 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Basic Info */}
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: Colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 14,
                  }}>
                    Basic Information
                  </Text>

                  {/* ✅ Patient Name Dropdown */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        color: Colors.textSecondary,
                      }}>
                        Patient Name
                      </Text>
                      <Text style={{ color: Colors.danger, marginLeft: 3 }}>*</Text>
                    </View>

                    {/* Dropdown Button */}
                    <TouchableOpacity
                      onPress={() => setDropdownOpen(!dropdownOpen)}
                      style={{
                        borderWidth: 1.5,
                        borderColor: errors.name
                          ? Colors.danger
                          : dropdownOpen
                          ? Colors.primary
                          : Colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        backgroundColor: Colors.background,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: 48,
                      }}
                    >
                      {loadingPatients ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                          <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
                            Loading patients...
                          </Text>
                        </View>
                      ) : form.name ? (
                        <View style={{
                          flexDirection: 'row', alignItems: 'center',
                          gap: 10, flex: 1,
                        }}>
                          <View style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: Colors.primary,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{
                              fontSize: 12, fontWeight: '700', color: Colors.white,
                            }}>
                              {getInitials(form.name)}
                            </Text>
                          </View>
                          <Text style={{
                            fontSize: 14, fontWeight: '600',
                            color: Colors.textPrimary, flex: 1,
                          }} numberOfLines={1}>
                            {form.name}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 14, color: Colors.textMuted, flex: 1 }}>
                          Select a registered patient...
                        </Text>
                      )}
                      <Ionicons
                        name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={dropdownOpen ? Colors.primary : Colors.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Dropdown List */}
                    {dropdownOpen && (
                      <View style={{
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: 12,
                        backgroundColor: Colors.white,
                        marginTop: 4,
                        maxHeight: 220,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                      }}>
                        <ScrollView
                          nestedScrollEnabled
                          showsVerticalScrollIndicator={false}
                        >
                          {registeredPatients.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                              <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
                              <Text style={{
                                color: Colors.textPrimary, fontSize: 14,
                                fontWeight: '600', marginTop: 8,
                              }}>
                                No registered patients found
                              </Text>
                              <Text style={{
                                color: Colors.textMuted, fontSize: 12,
                                marginTop: 4, textAlign: 'center',
                              }}>
                                Ask patients to register first
                              </Text>
                            </View>
                          ) : (
                            registeredPatients.map((patient, index) => (
                              <TouchableOpacity
                                key={patient.id}
                                onPress={() => handleSelectPatient(patient)}
                                activeOpacity={0.7}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 14,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  backgroundColor: form.userId === patient.id
                                    ? Colors.primaryLight
                                    : Colors.white,
                                  borderBottomWidth: index !== registeredPatients.length - 1 ? 1 : 0,
                                  borderBottomColor: Colors.borderLight,
                                }}
                              >
                                {/* Left: Avatar + Info */}
                                <View style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  flex: 1,
                                  gap: 12,
                                }}>
                                  <View style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: form.userId === patient.id
                                      ? Colors.primary
                                      : Colors.primaryLight,
                                    alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    <Text style={{
                                      fontSize: 14, fontWeight: '700',
                                      color: form.userId === patient.id
                                        ? Colors.white
                                        : Colors.primary,
                                    }}>
                                      {getInitials(patient.fullName)}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{
                                      fontSize: 14, fontWeight: '600',
                                      color: form.userId === patient.id
                                        ? Colors.primary
                                        : Colors.textPrimary,
                                    }} numberOfLines={1}>
                                      {patient.fullName}
                                    </Text>
                                    <Text style={{
                                      fontSize: 12, color: Colors.textMuted, marginTop: 2,
                                    }} numberOfLines={1}>
                                      {patient.email}
                                    </Text>
                                  </View>
                                </View>

                                {/* Right: Checkmark */}
                                {form.userId === patient.id && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={Colors.primary}
                                    style={{ marginLeft: 8, flexShrink: 0 }}
                                  />
                                )}
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {errors.name && (
                      <Text style={{ color: Colors.danger, fontSize: 12, marginTop: 6 }}>
                        {errors.name}
                      </Text>
                    )}
                  </View>

                  {/* Age */}
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
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        color: Colors.textSecondary,
                      }}>
                        Condition
                      </Text>
                      <Text style={{ color: Colors.danger, marginLeft: 3 }}>*</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CONDITIONS.map((c) => {
                        const selected = form.condition === c;
                        const cfg      = conditionColors[c];
                        return (
                          <TouchableOpacity
                            key={c}
                            onPress={() => setField('condition', c)}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 8,
                              borderRadius: 20, borderWidth: 1.5,
                              borderColor:     selected ? cfg.color : Colors.border,
                              backgroundColor: selected ? cfg.bg    : Colors.white,
                            }}
                          >
                            <Text style={{
                              fontSize: 13, fontWeight: '600',
                              color: selected ? cfg.color : Colors.textMuted,
                            }}>
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

                  {/* Stage */}
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
                  <View style={{
                    height: 1, backgroundColor: Colors.borderLight,
                    marginVertical: 4, marginBottom: 16,
                  }} />

                  {/* Medical Details */}
                  <Text style={{
                    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
                  }}>
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: loading ? Colors.primaryLight : Colors.primary,
                      borderRadius: 16, height: 52,
                      alignItems: 'center', justifyContent: 'center',
                      marginTop: 8, flexDirection: 'row', gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={18} color={Colors.white} />
                        <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 15 }}>
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