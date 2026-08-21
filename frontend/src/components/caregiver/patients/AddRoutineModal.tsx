// import React, { useState } from 'react';
// import {
//   View, Text, Modal, TouchableOpacity, ScrollView,
//   KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
//   ActivityIndicator, TextInput, TextInputProps,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../../../constants/colors';
// import { FormInput } from './FormInput';
// import { Routine } from '../../../types/caregiver.types';

// // ── Time Presets ──────────────────────────────────────────────────────────────
// const ALL_TIME_PRESETS = [
//   { label: '🌅 Morning',     time: '08:00 AM', slot: 'morning'   },
//   { label: '☀️ Mid-Morning', time: '10:00 AM', slot: 'morning'   },
//   { label: '🍽️ Lunch',      time: '12:00 PM', slot: 'afternoon' },
//   { label: '🌤️ Afternoon',  time: '02:00 PM', slot: 'afternoon' },
//   { label: '🌇 Evening',    time: '05:00 PM', slot: 'evening'   },
//   { label: '🌙 Night',      time: '08:00 PM', slot: 'evening'   },
// ];

// const MEDICATION_TIME_PRESETS = [
//   { label: '🌅 Morning',    time: '08:00 AM', slot: 'morning'   },
//   { label: '🌤️ Afternoon', time: '02:00 PM', slot: 'afternoon' },
//   { label: '🌇 Evening',   time: '06:00 PM', slot: 'evening'   },
// ];

// // ── Routine Suggestions ───────────────────────────────────────────────────────
// const ROUTINE_SUGGESTIONS = [
//   { label: '🥣 Breakfast',      value: 'Breakfast',      isMedication: false },
//   { label: '💊 Medication',     value: 'Medication',     isMedication: true  },
//   { label: '🚶 Morning Walk',   value: 'Morning Walk',   isMedication: false },
//   { label: '🛁 Bathing Assist', value: 'Bathing Assist', isMedication: false },
//   { label: '🎵 Music Therapy',  value: 'Music Therapy',  isMedication: false },
//   { label: '🌿 Garden Walk',    value: 'Garden Walk',    isMedication: false },
//   { label: '🍽️ Lunch Feeding', value: 'Lunch Feeding',  isMedication: false },
//   { label: '😴 Afternoon Rest', value: 'Afternoon Rest', isMedication: false },
//   { label: '🏋️ Physiotherapy', value: 'Physiotherapy',  isMedication: false },
//   { label: '📖 Reading Time',   value: 'Reading Time',   isMedication: false },
// ];

// const MED_FORMS = ['Tablet', 'Capsule', 'Patch', 'Liquid', 'Injection', 'Drops'];

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface FormData {
//   title: string;
//   time: string;
//   medName: string;
//   medDose: string;
//   medForm: string;
//   medNotes: string;
// }

// interface FormErrors {
//   title?: string;
//   time?: string;
//   medName?: string;
//   medDose?: string;
// }

// interface AddRoutineModalProps {
//   visible: boolean;
//   patientName: string;
//   onClose: () => void;
//   onSubmit: (routine: Omit<Routine, 'id'>) => void;
// }

// // ── Inline TextInput ──────────────────────────────────────────────────────────
// const TextInputInline: React.FC<TextInputProps> = (props) => (
//   <TextInput
//     style={{ fontSize: 14, color: Colors.textPrimary, minWidth: 0, padding: 0 }}
//     {...props}
//   />
// );

// // ── Component ─────────────────────────────────────────────────────────────────
// export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
//   visible, patientName, onClose, onSubmit,
// }) => {
//   const [form, setForm] = useState<FormData>({
//     title: '', time: '',
//     medName: '', medDose: '', medForm: 'Tablet', medNotes: '',
//   });
//   const [errors, setErrors]                         = useState<FormErrors>({});
//   const [loading, setLoading]                       = useState(false);
//   const [selectedPreset, setSelectedPreset]         = useState<string | null>(null);
//   const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
//   const [isMedicationMode, setIsMedicationMode]     = useState(false);

//   const activeTimePresets = isMedicationMode ? MEDICATION_TIME_PRESETS : ALL_TIME_PRESETS;

//   const setField = (key: keyof FormData, value: string) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//     if (errors[key as keyof FormErrors]) {
//       setErrors((prev) => ({ ...prev, [key]: undefined }));
//     }
//   };

//   const handleSelectSuggestion = (s: typeof ROUTINE_SUGGESTIONS[0]) => {
//     setSelectedSuggestion(s.value);
//     setField('title', s.value);
//     setIsMedicationMode(s.isMedication);
//     if (!s.isMedication) {
//       setForm((prev) => ({
//         ...prev, title: s.value,
//         medName: '', medDose: '', medForm: 'Tablet', medNotes: '',
//       }));
//     }
//     setSelectedPreset(null);
//     setField('time', '');
//   };

//   const handleSelectPreset = (preset: typeof ALL_TIME_PRESETS[0]) => {
//     setSelectedPreset(preset.time);
//     setField('time', preset.time);
//   };

//   const validate = (): boolean => {
//     const newErrors: FormErrors = {};
//     if (!form.title.trim()) newErrors.title = 'Routine name is required';
//     if (!form.time.trim())  newErrors.time  = 'Please select or enter a time';
//     if (isMedicationMode) {
//       if (!form.medName.trim()) newErrors.medName = 'Medication name is required';
//       if (!form.medDose.trim()) newErrors.medDose = 'Dose is required';
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validate()) return;
//     setLoading(true);
//     await new Promise((r) => setTimeout(r, 600));
//     const finalTitle = isMedicationMode && form.medName
//       ? `${form.medName} (${form.medDose})`
//       : form.title.trim();
//     onSubmit({ title: finalTitle, time: form.time.trim(), completed: false });
//     setLoading(false);
//     handleClose();
//   };

//   const handleClose = () => {
//     setForm({ title: '', time: '', medName: '', medDose: '', medForm: 'Tablet', medNotes: '' });
//     setErrors({});
//     setSelectedPreset(null);
//     setSelectedSuggestion(null);
//     setIsMedicationMode(false);
//     onClose();
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       transparent
//       statusBarTranslucent
//       onRequestClose={handleClose}
//     >
//       {/* Backdrop */}
//       <TouchableWithoutFeedback onPress={handleClose}>
//         <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' }}>

//           <TouchableWithoutFeedback>
//             {/* Sheet — fixed 92% height so form fills screen properly */}
//             <View
//               style={{
//                 height: '92%',
//                 backgroundColor: Colors.white,
//                 borderTopLeftRadius: 28,
//                 borderTopRightRadius: 28,
//                 overflow: 'hidden',
//               }}
//             >
//               {/* Handle bar */}
//               <View style={{
//                 width: 40, height: 4, borderRadius: 2,
//                 backgroundColor: Colors.border, alignSelf: 'center',
//                 marginTop: 12, marginBottom: 4,
//               }} />

//               {/* ── Header (fixed, does not scroll) ── */}
//               <View style={{
//                 flexDirection: 'row', alignItems: 'center',
//                 justifyContent: 'space-between',
//                 paddingHorizontal: 20, paddingVertical: 16,
//                 borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
//               }}>
//                 <View>
//                   <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
//                     Add Daily Routine
//                   </Text>
//                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
//                     <Ionicons name="person-outline" size={12} color={Colors.primary} />
//                     <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '600' }}>
//                       {patientName}
//                     </Text>
//                   </View>
//                 </View>
//                 <TouchableOpacity
//                   onPress={handleClose}
//                   style={{
//                     width: 36, height: 36, borderRadius: 18,
//                     backgroundColor: Colors.background,
//                     alignItems: 'center', justifyContent: 'center',
//                   }}
//                 >
//                   <Ionicons name="close" size={18} color={Colors.textSecondary} />
//                 </TouchableOpacity>
//               </View>

//               {/* ── Scrollable form body (KeyboardAvoidingView wraps only this) ── */}
//               <KeyboardAvoidingView
//                 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//                 style={{ flex: 1 }}
//               >
//                 <ScrollView
//                   contentContainerStyle={{
//                     padding: 20,
//                     paddingBottom: Platform.OS === 'ios' ? 50 : 40,
//                   }}
//                   showsVerticalScrollIndicator={false}
//                   keyboardShouldPersistTaps="handled"
//                 >
//                   {/* ── Routine Name Section ── */}
//                   <Text style={{
//                     fontSize: 11, fontWeight: '700', color: Colors.textMuted,
//                     textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
//                   }}>
//                     Routine Name
//                   </Text>

//                   {/* Suggestion chips */}
//                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
//                     {ROUTINE_SUGGESTIONS.map((s) => {
//                       const selected = selectedSuggestion === s.value;
//                       const isMed    = s.isMedication;
//                       return (
//                         <TouchableOpacity
//                           key={s.value}
//                           onPress={() => handleSelectSuggestion(s)}
//                           style={{
//                             paddingHorizontal: 12, paddingVertical: 7,
//                             borderRadius: 20, borderWidth: 1.5,
//                             borderColor: selected
//                               ? (isMed ? Colors.danger : Colors.primary)
//                               : Colors.border,
//                             backgroundColor: selected
//                               ? (isMed ? Colors.dangerSoft : Colors.primaryLight)
//                               : Colors.white,
//                           }}
//                         >
//                           <Text style={{
//                             fontSize: 12, fontWeight: '600',
//                             color: selected
//                               ? (isMed ? Colors.danger : Colors.primary)
//                               : Colors.textSecondary,
//                           }}>
//                             {s.label}
//                           </Text>
//                         </TouchableOpacity>
//                       );
//                     })}
//                   </View>

//                   {/* Custom name input */}
//                   <FormInput
//                     label="Or type a custom name"
//                     required
//                     placeholder="e.g. Evening Stretching"
//                     value={form.title}
//                     onChangeText={(v) => {
//                       setSelectedSuggestion(null);
//                       setIsMedicationMode(false);
//                       setField('title', v);
//                     }}
//                     error={errors.title}
//                     autoCapitalize="words"
//                   />

//                   {/* ── Medication Extra Section ──────────────────────────── */}
//                   {isMedicationMode && (
//                     <View style={{
//                       backgroundColor: Colors.dangerSoft,
//                       borderRadius: 20, padding: 16, marginBottom: 16,
//                       borderWidth: 1.5, borderColor: Colors.danger + '30',
//                     }}>
//                       {/* Section header */}
//                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
//                         <View style={{
//                           width: 32, height: 32, borderRadius: 10,
//                           backgroundColor: Colors.danger + '18',
//                           alignItems: 'center', justifyContent: 'center',
//                         }}>
//                           <Ionicons name="medical" size={16} color={Colors.danger} />
//                         </View>
//                         <View>
//                           <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.danger }}>
//                             Medication Details
//                           </Text>
//                           <Text style={{ fontSize: 11, color: Colors.danger + 'aa', marginTop: 1 }}>
//                             Required for medication routines
//                           </Text>
//                         </View>
//                       </View>

//                       {/* Medication name */}
//                       <View style={{ marginBottom: 12 }}>
//                         <Text style={{
//                           fontSize: 11, fontWeight: '700', color: Colors.danger,
//                           textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
//                         }}>
//                           Medication Name *
//                         </Text>
//                         <View style={{
//                           backgroundColor: Colors.white, borderRadius: 12,
//                           borderWidth: 1.5,
//                           borderColor: errors.medName ? Colors.danger : Colors.danger + '30',
//                           paddingHorizontal: 14, paddingVertical: 12,
//                         }}>
//                           <TextInputInline
//                             value={form.medName}
//                             onChangeText={(v) => setField('medName', v)}
//                             placeholder="e.g. Donepezil, Memantine..."
//                             placeholderTextColor={Colors.textMuted}
//                           />
//                         </View>
//                         {errors.medName && (
//                           <Text style={{ color: Colors.danger, fontSize: 11, marginTop: 4 }}>
//                             {errors.medName}
//                           </Text>
//                         )}
//                       </View>

//                       {/* Dose */}
//                       <View style={{ marginBottom: 12 }}>
//                         <Text style={{
//                           fontSize: 11, fontWeight: '700', color: Colors.danger,
//                           textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
//                         }}>
//                           Dose *
//                         </Text>
//                         <View style={{
//                           backgroundColor: Colors.white, borderRadius: 12,
//                           borderWidth: 1.5,
//                           borderColor: errors.medDose ? Colors.danger : Colors.danger + '30',
//                           paddingHorizontal: 14, paddingVertical: 12,
//                         }}>
//                           <TextInputInline
//                             value={form.medDose}
//                             onChangeText={(v) => setField('medDose', v)}
//                             placeholder="e.g. 10mg, 5ml..."
//                             placeholderTextColor={Colors.textMuted}
//                           />
//                         </View>
//                         {errors.medDose && (
//                           <Text style={{ color: Colors.danger, fontSize: 11, marginTop: 4 }}>
//                             {errors.medDose}
//                           </Text>
//                         )}
//                       </View>

//                       {/* Form type */}
//                       <View style={{ marginBottom: 12 }}>
//                         <Text style={{
//                           fontSize: 11, fontWeight: '700', color: Colors.danger,
//                           textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
//                         }}>
//                           Form
//                         </Text>
//                         <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
//                           {MED_FORMS.map((f) => {
//                             const sel = form.medForm === f;
//                             return (
//                               <TouchableOpacity
//                                 key={f}
//                                 onPress={() => setField('medForm', f)}
//                                 style={{
//                                   paddingHorizontal: 14, paddingVertical: 7,
//                                   borderRadius: 16,
//                                   backgroundColor: sel ? Colors.danger : Colors.white,
//                                   borderWidth: 1.5,
//                                   borderColor: sel ? Colors.danger : Colors.danger + '40',
//                                 }}
//                               >
//                                 <Text style={{
//                                   fontSize: 12, fontWeight: '700',
//                                   color: sel ? Colors.white : Colors.danger,
//                                 }}>
//                                   {f}
//                                 </Text>
//                               </TouchableOpacity>
//                             );
//                           })}
//                         </View>
//                       </View>

//                       {/* Notes */}
//                       <View>
//                         <Text style={{
//                           fontSize: 11, fontWeight: '700', color: Colors.danger,
//                           textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
//                         }}>
//                           Notes (optional)
//                         </Text>
//                         <View style={{
//                           backgroundColor: Colors.white, borderRadius: 12,
//                           borderWidth: 1.5, borderColor: Colors.danger + '30',
//                           paddingHorizontal: 14, paddingVertical: 12,
//                           minHeight: 72,
//                         }}>
//                           <TextInputInline
//                             value={form.medNotes}
//                             onChangeText={(v) => setField('medNotes', v)}
//                             placeholder="e.g. Take with food, avoid dairy..."
//                             placeholderTextColor={Colors.textMuted}
//                             multiline
//                             textAlignVertical="top"
//                           />
//                         </View>
//                       </View>
//                     </View>
//                   )}
//                   {/* ───────────────────────────────────────────────────────── */}

//                   {/* Divider */}
//                   <View style={{ height: 1, backgroundColor: Colors.borderLight, marginBottom: 20 }} />

//                   {/* ── Time Section ── */}
//                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
//                     <Text style={{
//                       fontSize: 11, fontWeight: '700', color: Colors.textMuted,
//                       textTransform: 'uppercase', letterSpacing: 1,
//                     }}>
//                       Time
//                     </Text>
//                     {isMedicationMode && (
//                       <View style={{
//                         paddingHorizontal: 8, paddingVertical: 3,
//                         borderRadius: 8, backgroundColor: Colors.dangerSoft,
//                       }}>
//                         <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.danger }}>
//                           Medication Schedule
//                         </Text>
//                       </View>
//                     )}
//                   </View>

//                   {/* Time preset chips */}
//                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
//                     {activeTimePresets.map((preset) => {
//                       const selected = selectedPreset === preset.time;
//                       const activeColor = isMedicationMode ? Colors.danger : Colors.primary;
//                       const activeBg    = isMedicationMode ? Colors.dangerSoft : Colors.primaryLight;
//                       return (
//                         <TouchableOpacity
//                           key={preset.time}
//                           onPress={() => handleSelectPreset(preset)}
//                           style={{
//                             paddingHorizontal: 16, paddingVertical: 10,
//                             borderRadius: 20, borderWidth: 1.5,
//                             borderColor: selected ? activeColor : Colors.border,
//                             backgroundColor: selected ? activeBg : Colors.white,
//                             alignItems: 'center', minWidth: 90,
//                           }}
//                         >
//                           <Text style={{
//                             fontSize: 12, fontWeight: '600',
//                             color: selected ? activeColor : Colors.textSecondary,
//                           }}>
//                             {preset.label}
//                           </Text>
//                           <Text style={{
//                             fontSize: 10, marginTop: 2,
//                             color: selected ? activeColor : Colors.textMuted,
//                             fontWeight: '500',
//                           }}>
//                             {preset.time}
//                           </Text>
//                         </TouchableOpacity>
//                       );
//                     })}
//                   </View>

//                   {/* Custom time input */}
//                   <FormInput
//                     label="Or enter custom time"
//                     required
//                     placeholder="e.g. 03:30 PM"
//                     value={form.time}
//                     onChangeText={(v) => {
//                       setSelectedPreset(null);
//                       setField('time', v);
//                     }}
//                     error={errors.time}
//                     keyboardType="default"
//                   />

//                   {/* ── Preview Card ── */}
//                   {(form.title || form.time) && (
//                     <View style={{
//                       backgroundColor: isMedicationMode ? Colors.dangerSoft : Colors.primaryLight,
//                       borderRadius: 16, padding: 14, marginBottom: 20,
//                       borderWidth: 1,
//                       borderColor: (isMedicationMode ? Colors.danger : Colors.primary) + '30',
//                       flexDirection: 'row', alignItems: 'center', gap: 12,
//                     }}>
//                       <View style={{
//                         width: 38, height: 38, borderRadius: 13,
//                         backgroundColor: isMedicationMode ? Colors.danger : Colors.primary,
//                         alignItems: 'center', justifyContent: 'center',
//                       }}>
//                         <Ionicons
//                           name={isMedicationMode ? 'medical' : 'time-outline'}
//                           size={18} color={Colors.white}
//                         />
//                       </View>
//                       <View style={{ flex: 1 }}>
//                         <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>
//                           {isMedicationMode && form.medName
//                             ? `${form.medName}${form.medDose ? ` · ${form.medDose}` : ''}`
//                             : (form.title || 'Routine name...')}
//                         </Text>
//                         {isMedicationMode && form.medForm && (
//                           <Text style={{ fontSize: 11, color: Colors.danger, fontWeight: '600', marginTop: 1 }}>
//                             {form.medForm}
//                           </Text>
//                         )}
//                         <Text style={{
//                           fontSize: 12, marginTop: 2, fontWeight: '600',
//                           color: isMedicationMode ? Colors.danger : Colors.primary,
//                         }}>
//                           {form.time || 'Time not set'}
//                         </Text>
//                       </View>
//                       <View style={{
//                         paddingHorizontal: 8, paddingVertical: 3,
//                         borderRadius: 10, backgroundColor: Colors.successSoft,
//                       }}>
//                         <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.success }}>
//                           PREVIEW
//                         </Text>
//                       </View>
//                     </View>
//                   )}

//                   {/* ── Submit Button ── */}
//                   <TouchableOpacity
//                     onPress={handleSubmit}
//                     disabled={loading}
//                     activeOpacity={0.85}
//                     style={{
//                       height: 52, borderRadius: 16,
//                       backgroundColor: loading
//                         ? Colors.borderLight
//                         : (isMedicationMode ? Colors.danger : Colors.primary),
//                       alignItems: 'center', justifyContent: 'center',
//                       flexDirection: 'row', gap: 8,
//                       shadowColor: isMedicationMode ? Colors.danger : Colors.primary,
//                       shadowOffset: { width: 0, height: 4 },
//                       shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
//                     }}
//                   >
//                     {loading ? (
//                       <ActivityIndicator
//                         color={isMedicationMode ? Colors.danger : Colors.primary}
//                         size="small"
//                       />
//                     ) : (
//                       <>
//                         <Ionicons
//                           name={isMedicationMode ? 'medical-outline' : 'add-circle-outline'}
//                           size={20} color={Colors.white}
//                         />
//                         <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 15 }}>
//                           {isMedicationMode ? 'Add Medication Routine' : 'Add Routine'}
//                         </Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 </ScrollView>
//               </KeyboardAvoidingView>
//             </View>
//           </TouchableWithoutFeedback>
//         </View>
//       </TouchableWithoutFeedback>
//     </Modal>
//   );
// };

import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  ActivityIndicator, TextInput, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { FormInput } from './FormInput';
import { Routine } from '../../../types/caregiver.types';

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_TIME_PRESETS = [
  { label: '🌅 Morning',     time: '08:00 AM', slot: 'morning'   },
  { label: '☀️ Mid-Morning', time: '10:00 AM', slot: 'morning'   },
  { label: '🍽️ Lunch',      time: '12:00 PM', slot: 'afternoon' },
  { label: '🌤️ Afternoon',  time: '02:00 PM', slot: 'afternoon' },
  { label: '🌇 Evening',    time: '05:00 PM', slot: 'evening'   },
  { label: '🌙 Night',      time: '08:00 PM', slot: 'evening'   },
];

const MEDICATION_TIME_PRESETS = [
  { label: '🌅 Morning',    time: '08:00 AM', slot: 'morning'   },
  { label: '🌤️ Afternoon', time: '02:00 PM', slot: 'afternoon' },
  { label: '🌇 Evening',   time: '06:00 PM', slot: 'evening'   },
];

const ROUTINE_SUGGESTIONS = [
  { label: '🥣 Breakfast',      value: 'Breakfast',      isMedication: false },
  { label: '💊 Medication',     value: 'Medication',     isMedication: true  },
  { label: '🚶 Morning Walk',   value: 'Morning Walk',   isMedication: false },
  { label: '🛁 Bathing Assist', value: 'Bathing Assist', isMedication: false },
  { label: '🎵 Music Therapy',  value: 'Music Therapy',  isMedication: false },
  { label: '🌿 Garden Walk',    value: 'Garden Walk',    isMedication: false },
  { label: '🍽️ Lunch Feeding', value: 'Lunch Feeding',  isMedication: false },
  { label: '😴 Afternoon Rest', value: 'Afternoon Rest', isMedication: false },
  { label: '🏋️ Physiotherapy', value: 'Physiotherapy',  isMedication: false },
  { label: '📖 Reading Time',   value: 'Reading Time',   isMedication: false },
];

const MED_FORMS = ['Tablet', 'Capsule', 'Patch', 'Liquid', 'Injection', 'Drops'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  title:    string;
  time:     string;
  medName:  string;
  medDose:  string;
  medForm:  string;
  medNotes: string;
}

interface FormErrors {
  title?:   string;
  time?:    string;
  medName?: string;
  medDose?: string;
}

interface AddRoutineModalProps {
  visible:      boolean;
  patientName:  string;
  patientId:    string;    // ✅
  patientColor?: string;   // ✅
  onClose:      () => void;
  onSubmit:     (routine: Omit<Routine, 'id'>) => Promise<void>;
}

// ── Inline TextInput ──────────────────────────────────────────────────────────
const TextInputInline: React.FC<TextInputProps> = (props) => (
  <TextInput
    style={{ fontSize: 14, color: Colors.textPrimary, minWidth: 0, padding: 0 }}
    {...props}
  />
);

// ── Component ─────────────────────────────────────────────────────────────────
export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  visible, patientName, patientId, patientColor, onClose, onSubmit, // ✅ FIXED
}) => {
  const [form, setForm] = useState<FormData>({
    title: '', time: '',
    medName: '', medDose: '', medForm: 'Tablet', medNotes: '',
  });
  const [errors, setErrors]                         = useState<FormErrors>({});
  const [loading, setLoading]                       = useState(false);
  const [selectedPreset, setSelectedPreset]         = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [isMedicationMode, setIsMedicationMode]     = useState(false);

  const activeTimePresets = isMedicationMode
    ? MEDICATION_TIME_PRESETS
    : ALL_TIME_PRESETS;

  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSelectSuggestion = (s: typeof ROUTINE_SUGGESTIONS[0]) => {
    setSelectedSuggestion(s.value);
    setField('title', s.value);
    setIsMedicationMode(s.isMedication);
    if (!s.isMedication) {
      setForm((prev) => ({
        ...prev, title: s.value,
        medName: '', medDose: '', medForm: 'Tablet', medNotes: '',
      }));
    }
    setSelectedPreset(null);
    setField('time', '');
  };

  const handleSelectPreset = (preset: typeof ALL_TIME_PRESETS[0]) => {
    setSelectedPreset(preset.time);
    setField('time', preset.time);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Routine name is required';
    if (!form.time.trim())  newErrors.time  = 'Please select or enter a time';
    if (isMedicationMode) {
      if (!form.medName.trim()) newErrors.medName = 'Medication name is required';
      if (!form.medDose.trim()) newErrors.medDose = 'Dose is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isMedicationMode) {
        // ✅ Save medication to database
        const { createMedication } = await import(
          '../../../services/caregiver/medicationService'
        );

        const preset   = MEDICATION_TIME_PRESETS.find(p => p.time === form.time);
        const timeSlot = preset?.slot || 'morning';

        await createMedication({
          name:            form.medName,
          dose:            form.medDose,
          form:            form.medForm,
          notes:           form.medNotes,
          time:            form.time,
          timeSlot,
          patientId:       patientId,  // ✅ FIXED
          patientName:     patientName,
          patientInitials: patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          patientColor:    patientColor || '#4F8EF7',  // ✅ FIXED
        });
      }

      const finalTitle = isMedicationMode && form.medName
        ? `${form.medName} (${form.medDose})`
        : form.title.trim();

      await onSubmit({
        title:     finalTitle,
        time:      form.time.trim(),
        completed: false,
      });

      handleClose();
    } catch (error) {
      console.log('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      title: '', time: '',
      medName: '', medDose: '', medForm: 'Tablet', medNotes: '',
    });
    setErrors({});
    setSelectedPreset(null);
    setSelectedSuggestion(null);
    setIsMedicationMode(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(15,23,42,0.65)',
          justifyContent: 'flex-end',
        }}>
          <TouchableWithoutFeedback>
            <View style={{
              height: '92%',
              backgroundColor: Colors.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
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
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
              }}>
                <View>
                  <Text style={{
                    fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
                  }}>
                    Add Daily Routine
                  </Text>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    gap: 4, marginTop: 3,
                  }}>
                    <Ionicons name="person-outline" size={12} color={Colors.primary} />
                    <Text style={{
                      fontSize: 12, color: Colors.primary, fontWeight: '600',
                    }}>
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

              {/* Scrollable Body */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView
                  contentContainerStyle={{
                    padding: 20,
                    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
                  }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Routine Name Section */}
                  <Text style={{
                    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
                  }}>
                    Routine Name
                  </Text>

                  {/* Suggestion chips */}
                  <View style={{
                    flexDirection: 'row', flexWrap: 'wrap',
                    gap: 8, marginBottom: 14,
                  }}>
                    {ROUTINE_SUGGESTIONS.map((s) => {
                      const selected = selectedSuggestion === s.value;
                      const isMed    = s.isMedication;
                      return (
                        <TouchableOpacity
                          key={s.value}
                          onPress={() => handleSelectSuggestion(s)}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 7,
                            borderRadius: 20, borderWidth: 1.5,
                            borderColor: selected
                              ? (isMed ? Colors.danger : Colors.primary)
                              : Colors.border,
                            backgroundColor: selected
                              ? (isMed ? Colors.dangerSoft : Colors.primaryLight)
                              : Colors.white,
                          }}
                        >
                          <Text style={{
                            fontSize: 12, fontWeight: '600',
                            color: selected
                              ? (isMed ? Colors.danger : Colors.primary)
                              : Colors.textSecondary,
                          }}>
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
                      setIsMedicationMode(false);
                      setField('title', v);
                    }}
                    error={errors.title}
                    autoCapitalize="words"
                  />

                  {/* Medication Extra Section */}
                  {isMedicationMode && (
                    <View style={{
                      backgroundColor: Colors.dangerSoft,
                      borderRadius: 20, padding: 16, marginBottom: 16,
                      borderWidth: 1.5, borderColor: Colors.danger + '30',
                    }}>
                      {/* Section header */}
                      <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        gap: 8, marginBottom: 14,
                      }}>
                        <View style={{
                          width: 32, height: 32, borderRadius: 10,
                          backgroundColor: Colors.danger + '18',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name="medical" size={16} color={Colors.danger} />
                        </View>
                        <View>
                          <Text style={{
                            fontSize: 13, fontWeight: '800', color: Colors.danger,
                          }}>
                            Medication Details
                          </Text>
                          <Text style={{
                            fontSize: 11, color: Colors.danger + 'aa', marginTop: 1,
                          }}>
                            Required for medication routines
                          </Text>
                        </View>
                      </View>

                      {/* Medication name */}
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{
                          fontSize: 11, fontWeight: '700', color: Colors.danger,
                          textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
                        }}>
                          Medication Name *
                        </Text>
                        <View style={{
                          backgroundColor: Colors.white, borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: errors.medName ? Colors.danger : Colors.danger + '30',
                          paddingHorizontal: 14, paddingVertical: 12,
                        }}>
                          <TextInputInline
                            value={form.medName}
                            onChangeText={(v) => setField('medName', v)}
                            placeholder="e.g. Donepezil, Memantine..."
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                        {errors.medName && (
                          <Text style={{
                            color: Colors.danger, fontSize: 11, marginTop: 4,
                          }}>
                            {errors.medName}
                          </Text>
                        )}
                      </View>

                      {/* Dose */}
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{
                          fontSize: 11, fontWeight: '700', color: Colors.danger,
                          textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
                        }}>
                          Dose *
                        </Text>
                        <View style={{
                          backgroundColor: Colors.white, borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: errors.medDose ? Colors.danger : Colors.danger + '30',
                          paddingHorizontal: 14, paddingVertical: 12,
                        }}>
                          <TextInputInline
                            value={form.medDose}
                            onChangeText={(v) => setField('medDose', v)}
                            placeholder="e.g. 10mg, 5ml..."
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                        {errors.medDose && (
                          <Text style={{
                            color: Colors.danger, fontSize: 11, marginTop: 4,
                          }}>
                            {errors.medDose}
                          </Text>
                        )}
                      </View>

                      {/* Form type */}
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{
                          fontSize: 11, fontWeight: '700', color: Colors.danger,
                          textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
                        }}>
                          Form
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                          {MED_FORMS.map((f) => {
                            const sel = form.medForm === f;
                            return (
                              <TouchableOpacity
                                key={f}
                                onPress={() => setField('medForm', f)}
                                style={{
                                  paddingHorizontal: 14, paddingVertical: 7,
                                  borderRadius: 16,
                                  backgroundColor: sel ? Colors.danger : Colors.white,
                                  borderWidth: 1.5,
                                  borderColor: sel ? Colors.danger : Colors.danger + '40',
                                }}
                              >
                                <Text style={{
                                  fontSize: 12, fontWeight: '700',
                                  color: sel ? Colors.white : Colors.danger,
                                }}>
                                  {f}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Notes */}
                      <View>
                        <Text style={{
                          fontSize: 11, fontWeight: '700', color: Colors.danger,
                          textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7,
                        }}>
                          Notes (optional)
                        </Text>
                        <View style={{
                          backgroundColor: Colors.white, borderRadius: 12,
                          borderWidth: 1.5, borderColor: Colors.danger + '30',
                          paddingHorizontal: 14, paddingVertical: 12,
                          minHeight: 72,
                        }}>
                          <TextInputInline
                            value={form.medNotes}
                            onChangeText={(v) => setField('medNotes', v)}
                            placeholder="e.g. Take with food, avoid dairy..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            textAlignVertical="top"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Divider */}
                  <View style={{
                    height: 1, backgroundColor: Colors.borderLight, marginBottom: 20,
                  }} />

                  {/* Time Section */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    gap: 8, marginBottom: 12,
                  }}>
                    <Text style={{
                      fontSize: 11, fontWeight: '700', color: Colors.textMuted,
                      textTransform: 'uppercase', letterSpacing: 1,
                    }}>
                      Time
                    </Text>
                    {isMedicationMode && (
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 3,
                        borderRadius: 8, backgroundColor: Colors.dangerSoft,
                      }}>
                        <Text style={{
                          fontSize: 10, fontWeight: '700', color: Colors.danger,
                        }}>
                          Medication Schedule
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Time preset chips */}
                  <View style={{
                    flexDirection: 'row', flexWrap: 'wrap',
                    gap: 8, marginBottom: 14,
                  }}>
                    {activeTimePresets.map((preset) => {
                      const selected    = selectedPreset === preset.time;
                      const activeColor = isMedicationMode ? Colors.danger     : Colors.primary;
                      const activeBg    = isMedicationMode ? Colors.dangerSoft : Colors.primaryLight;
                      return (
                        <TouchableOpacity
                          key={preset.time}
                          onPress={() => handleSelectPreset(preset)}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 10,
                            borderRadius: 20, borderWidth: 1.5,
                            borderColor:     selected ? activeColor : Colors.border,
                            backgroundColor: selected ? activeBg    : Colors.white,
                            alignItems: 'center', minWidth: 90,
                          }}
                        >
                          <Text style={{
                            fontSize: 12, fontWeight: '600',
                            color: selected ? activeColor : Colors.textSecondary,
                          }}>
                            {preset.label}
                          </Text>
                          <Text style={{
                            fontSize: 10, marginTop: 2, fontWeight: '500',
                            color: selected ? activeColor : Colors.textMuted,
                          }}>
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

                  {/* Preview Card */}
                  {(form.title || form.time) && (
                    <View style={{
                      backgroundColor: isMedicationMode
                        ? Colors.dangerSoft : Colors.primaryLight,
                      borderRadius: 16, padding: 14, marginBottom: 20,
                      borderWidth: 1,
                      borderColor: (isMedicationMode
                        ? Colors.danger : Colors.primary) + '30',
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                    }}>
                      <View style={{
                        width: 38, height: 38, borderRadius: 13,
                        backgroundColor: isMedicationMode
                          ? Colors.danger : Colors.primary,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons
                          name={isMedicationMode ? 'medical' : 'time-outline'}
                          size={18} color={Colors.white}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 13, fontWeight: '700', color: Colors.textPrimary,
                        }}>
                          {isMedicationMode && form.medName
                            ? `${form.medName}${form.medDose ? ` · ${form.medDose}` : ''}`
                            : (form.title || 'Routine name...')}
                        </Text>
                        {isMedicationMode && form.medForm && (
                          <Text style={{
                            fontSize: 11, color: Colors.danger,
                            fontWeight: '600', marginTop: 1,
                          }}>
                            {form.medForm}
                          </Text>
                        )}
                        <Text style={{
                          fontSize: 12, marginTop: 2, fontWeight: '600',
                          color: isMedicationMode ? Colors.danger : Colors.primary,
                        }}>
                          {form.time || 'Time not set'}
                        </Text>
                      </View>
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 3,
                        borderRadius: 10, backgroundColor: Colors.successSoft,
                      }}>
                        <Text style={{
                          fontSize: 10, fontWeight: '700', color: Colors.success,
                        }}>
                          PREVIEW
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                      height: 52, borderRadius: 16,
                      backgroundColor: loading
                        ? Colors.borderLight
                        : (isMedicationMode ? Colors.danger : Colors.primary),
                      alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 8,
                      shadowColor: isMedicationMode ? Colors.danger : Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={isMedicationMode
                            ? 'medical-outline' : 'add-circle-outline'}
                          size={20} color={Colors.white}
                        />
                        <Text style={{
                          color: Colors.white, fontWeight: '700', fontSize: 15,
                        }}>
                          {isMedicationMode ? 'Add Medication Routine' : 'Add Routine'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};