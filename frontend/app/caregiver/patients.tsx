// import React, { useState, useMemo } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StatusBar,
//   RefreshControl,
//   TouchableOpacity,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../../src/constants/colors';
// import { PatientSearchBar } from '../../src/components/caregiver/patients/PatientSearchBar';
// import { PatientListItem } from '../../src/components/caregiver/patients/PatientListItem';
// import { AddPatientModal } from '../../src/components/caregiver/patients/AddPatientModal';
// import { AddRoutineModal } from '../../src/components/caregiver/patients/AddRoutineModal';
// import { PatientDetail, Routine } from '../../src/types/caregiver.types';

// // ── Mock Data ─────────────────────────────────────────────────────────────────
// const MOCK_PATIENTS: PatientDetail[] = [
//   {
//     id: '1',
//     name: 'Eleanor Vance',
//     initials: 'EV',
//     age: 82,
//     condition: 'Moderate',
//     stage: 'Early',
//     avatarColor: '#4F8EF7',
//     emoji: '😊',
//     lastChecked: '2h ago',
//     condition_notes: 'Frontotemporal Dementia',
//     condition_description:
//       'Loves gardening. Can be impulsive, needs gentle redirection.',
//     routines: [
//       { id: 'r1', title: 'Breakfast',   time: '08:00 AM', completed: true  },
//       { id: 'r2', title: 'Garden Walk', time: '10:00 AM', completed: true  },
//       { id: 'r3', title: 'Medication',  time: '01:00 PM', completed: false },
//     ],
//   },
//   {
//     id: '2',
//     name: 'Robert Chen',
//     initials: 'RC',
//     age: 78,
//     condition: 'Mild',
//     stage: 'Early',
//     avatarColor: '#22C55E',
//     emoji: '😴',
//     lastChecked: '30m ago',
//     condition_notes: "Alzheimer's Disease",
//     condition_description:
//       'Enjoys music therapy. Responds well to familiar songs from the 1960s.',
//     routines: [
//       { id: 'r1', title: 'Morning Walk',  time: '07:30 AM', completed: true  },
//       { id: 'r2', title: 'Medication',    time: '09:00 AM', completed: false },
//       { id: 'r3', title: 'Music Session', time: '03:00 PM', completed: false },
//     ],
//   },
//   {
//     id: '3',
//     name: 'Margaret Hughes',
//     initials: 'MH',
//     age: 85,
//     condition: 'Moderate',
//     stage: 'Advanced',
//     avatarColor: '#F97316',
//     emoji: '🙂',
//     lastChecked: '1h ago',
//     condition_notes: 'Vascular Dementia',
//     condition_description:
//       'Requires assistance with daily activities. Calm environment preferred.',
//     routines: [
//       { id: 'r1', title: 'Breakfast',      time: '08:30 AM', completed: true  },
//       { id: 'r2', title: 'Physiotherapy',  time: '11:00 AM', completed: false },
//       { id: 'r3', title: 'Afternoon Rest', time: '02:00 PM', completed: false },
//     ],
//   },
//   {
//     id: '4',
//     name: 'Arthur Pendelton',
//     initials: 'AP',
//     age: 74,
//     condition: 'Stable',
//     stage: 'Moderate',
//     avatarColor: '#8B5CF6',
//     emoji: '😌',
//     lastChecked: '3h ago',
//     condition_notes: 'Lewy Body Dementia',
//     condition_description:
//       'Experiences vivid visual hallucinations. Keep lighting bright during the day.',
//     routines: [
//       { id: 'r1', title: 'Breakfast',    time: '08:00 AM', completed: true  },
//       { id: 'r2', title: 'Medication',   time: '10:00 AM', completed: true  },
//       { id: 'r3', title: 'Evening Walk', time: '05:00 PM', completed: false },
//     ],
//   },
// ];
// // ─────────────────────────────────────────────────────────────────────────────

// export default function PatientsScreen() {
//   const [searchQuery, setSearchQuery]   = useState('');
//   const [expandedId, setExpandedId]     = useState<string | null>(null);
//   const [patients, setPatients]         = useState<PatientDetail[]>(MOCK_PATIENTS);
//   const [refreshing, setRefreshing]     = useState(false);
//   const [patientModalVisible, setPatientModalVisible] = useState(false);
//   const [routineModal, setRoutineModal] = useState<{
//     visible: boolean;
//     patientId: string | null;
//     patientName: string;
//   }>({ visible: false, patientId: null, patientName: '' });

//   // ── Filter ──────────────────────────────────────────────────────────────────
//   const filteredPatients = useMemo(() => {
//     if (!searchQuery.trim()) return patients;
//     const q = searchQuery.toLowerCase();
//     return patients.filter(
//       (p) =>
//         p.name.toLowerCase().includes(q) ||
//         p.condition.toLowerCase().includes(q) ||
//         p.condition_notes.toLowerCase().includes(q),
//     );
//   }, [searchQuery, patients]);

//   // ── Handlers ────────────────────────────────────────────────────────────────
//   const handleToggleExpand = (id: string) =>
//     setExpandedId((prev) => (prev === id ? null : id));

//   const handleRoutineToggle = (patientId: string, routineId: string) => {
//     setPatients((prev) =>
//       prev.map((p) =>
//         p.id !== patientId
//           ? p
//           : {
//               ...p,
//               routines: p.routines.map((r) =>
//                 r.id === routineId ? { ...r, completed: !r.completed } : r,
//               ),
//             },
//       ),
//     );
//   };

//   const handleAddRoutine = (patientId: string) => {
//     const patient = patients.find((p) => p.id === patientId);
//     if (!patient) return;
//     setRoutineModal({ visible: true, patientId, patientName: patient.name });
//   };

//   const handleRoutineSubmit = (routine: Omit<Routine, 'id'>) => {
//     if (!routineModal.patientId) return;
//     const newRoutine: Routine = { ...routine, id: `r-${Date.now()}` };
//     setPatients((prev) =>
//       prev.map((p) =>
//         p.id !== routineModal.patientId
//           ? p
//           : { ...p, routines: [...p.routines, newRoutine] },
//       ),
//     );
//   };

//   const handleAddPatient = (
//     newPatientData: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'>,
//   ) => {
//     const newPatient: PatientDetail = {
//       ...newPatientData,
//       id: Date.now().toString(),
//       emoji: '🙂',
//       lastChecked: 'Just now',
//       routines: [],
//     };
//     setPatients((prev) => [newPatient, ...prev]);
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1000);
//   };

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <View style={{ flex: 1, backgroundColor: Colors.background }}>
//       <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

//       {/* ── Fixed Header ── */}
//       <View
//         style={{
//           backgroundColor: Colors.background,
//           paddingTop: 56,
//           paddingBottom: 4,
//           // ← NO paddingHorizontal here — each child manages its own
//         }}
//       >
//         {/* Title row — has its own horizontal padding */}
//         <View
//           style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: 16,
//             paddingHorizontal: 20,   // ← only title row needs this
//           }}
//         >
//           <Text
//             style={{
//               fontSize: 24,
//               fontWeight: '800',
//               color: Colors.textPrimary,
//             }}
//           >
//             Patients
//           </Text>

//           <TouchableOpacity
//             onPress={() => setPatientModalVisible(true)}
//             activeOpacity={0.85}
//             style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               gap: 6,
//               backgroundColor: Colors.primary,
//               paddingHorizontal: 14,
//               paddingVertical: 8,
//               borderRadius: 20,
//               shadowColor: Colors.primary,
//               shadowOffset: { width: 0, height: 4 },
//               shadowOpacity: 0.3,
//               shadowRadius: 8,
//               elevation: 4,
//             }}
//           >
//             <Ionicons name="add" size={16} color={Colors.white} />
//             <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 13 }}>
//               Add Patient
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Search bar — manages its own marginHorizontal: 20 internally */}
//         <PatientSearchBar
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           onClear={() => setSearchQuery('')}
//         />
//       </View>

//       {/* ── Patient List ── */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor={Colors.primary}
//           />
//         }
//         contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
//       >
//         {filteredPatients.length === 0 ? (
//           <View
//             style={{
//               alignItems: 'center',
//               justifyContent: 'center',
//               marginTop: 80,
//             }}
//           >
//             <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
//             <Text
//               style={{
//                 fontWeight: '700',
//                 fontSize: 16,
//                 color: Colors.textPrimary,
//                 marginBottom: 6,
//               }}
//             >
//               No patients found
//             </Text>
//             <Text
//               style={{
//                 fontSize: 13,
//                 color: Colors.textMuted,
//                 textAlign: 'center',
//                 paddingHorizontal: 40,
//               }}
//             >
//               Try searching by name, condition, or diagnosis
//             </Text>
//           </View>
//         ) : (
//           filteredPatients.map((patient, index) => (
//             <PatientListItem
//               key={patient.id}
//               patient={patient}
//               index={index}
//               isExpanded={expandedId === patient.id}
//               onToggleExpand={handleToggleExpand}
//               onRoutineToggle={handleRoutineToggle}
//               onAddRoutine={handleAddRoutine}
//             />
//           ))
//         )}
//       </ScrollView>

//       {/* ── Modals ── */}
//       <AddPatientModal
//         visible={patientModalVisible}
//         onClose={() => setPatientModalVisible(false)}
//         onSubmit={handleAddPatient}
//       />

//       <AddRoutineModal
//         visible={routineModal.visible}
//         patientName={routineModal.patientName}
//         onClose={() =>
//           setRoutineModal({ visible: false, patientId: null, patientName: '' })
//         }
//         onSubmit={handleRoutineSubmit}
//       />
//     </View>
//   );
// }

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StatusBar,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { PatientSearchBar }  from '../../src/components/caregiver/patients/PatientSearchBar';
import { PatientListItem }   from '../../src/components/caregiver/patients/PatientListItem';
import { AddPatientModal }   from '../../src/components/caregiver/patients/AddPatientModal';
import { AddRoutineModal }   from '../../src/components/caregiver/patients/AddRoutineModal';
import { PatientDetail, Routine } from '../../src/types/caregiver.types';
import {
  fetchPatients,
  createPatient,
  addRoutine,
  toggleRoutine,
} from '../../src/services/caregiver/patientService';

export default function PatientsScreen() {
  const [patients, setPatients]       = useState<PatientDetail[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [routineModal, setRoutineModal] = useState<{
    visible:     boolean;
    patientId:   string | null;
    patientName: string;
  }>({ visible: false, patientId: null, patientName: '' });

  // ── Load patients from backend ─────────────────────────────────────────────
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPatients();
      setPatients(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q) ||
        p.condition_notes.toLowerCase().includes(q),
    );
  }, [searchQuery, patients]);

  // ── Expand/collapse ────────────────────────────────────────────────────────
  const handleToggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // ── Toggle routine ─────────────────────────────────────────────────────────
  const handleRoutineToggle = async (patientId: string, routineId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id !== patientId ? p : {
          ...p,
          routines: p.routines.map((r) =>
            r.id === routineId ? { ...r, completed: !r.completed } : r
          ),
        }
      )
    );

    try {
      const updated = await toggleRoutine(patientId, routineId);
      setPatients((prev) =>
        prev.map((p) =>
          p.id !== patientId ? p : {
            ...p,
            routines: p.routines.map((r) =>
              r.id === routineId ? updated : r
            ),
          }
        )
      );
    } catch (error) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id !== patientId ? p : {
            ...p,
            routines: p.routines.map((r) =>
              r.id === routineId ? { ...r, completed: !r.completed } : r
            ),
          }
        )
      );
      Alert.alert('Error', 'Failed to update routine.');
    }
  };

  // ── Open add routine modal ─────────────────────────────────────────────────
  const handleAddRoutine = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    setRoutineModal({ visible: true, patientId, patientName: patient.name });
  };

  // ── Submit new routine to backend ──────────────────────────────────────────
  const handleRoutineSubmit = async (routine: Omit<Routine, 'id'>) => {
    if (!routineModal.patientId) return;
    try {
      const savedRoutine = await addRoutine(routineModal.patientId, routine);
      setPatients((prev) =>
        prev.map((p) =>
          p.id !== routineModal.patientId ? p : {
            ...p,
            routines: [...p.routines, savedRoutine],
          }
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add routine.');
    }
  };

  // ── Submit new patient to backend ──────────────────────────────────────────
  const handleAddPatient = async (
    newPatientData: Omit<PatientDetail, 'id' | 'emoji' | 'lastChecked' | 'routines'> & {
      userId?: string;
    }
  ) => {
    try {
      console.log('Submitting patient:', newPatientData);
      const savedPatient = await createPatient(newPatientData);
      console.log('Saved patient:', savedPatient);
      setPatients((prev) => [savedPatient, ...prev]);
      Alert.alert('Success', 'Patient added successfully!');
    } catch (error) {
      console.log('Add patient error:', error);
      Alert.alert('Error', 'Failed to add patient. Check your connection.');
      throw error;
    }
  };

  // ── Refresh ────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Fixed Header */}
      <View style={{ backgroundColor: Colors.background, paddingTop: 56, paddingBottom: 4 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16, paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.textPrimary }}>
            Patients
          </Text>
          <TouchableOpacity
            onPress={() => setPatientModalVisible(true)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: Colors.primary,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 13 }}>
              Add Patient
            </Text>
          </TouchableOpacity>
        </View>

        <PatientSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Patient List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
              Loading patients...
            </Text>
          </View>

        ) : filteredPatients.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>
              {patients.length === 0 ? '👤' : '🔍'}
            </Text>
            <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.textPrimary, marginBottom: 6 }}>
              {patients.length === 0 ? 'No patients yet' : 'No patients found'}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 }}>
              {patients.length === 0
                ? 'Tap "Add Patient" to add your first patient'
                : 'Try searching by name, condition, or diagnosis'}
            </Text>
          </View>

        ) : (
          filteredPatients.map((patient, index) => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              index={index}
              isExpanded={expandedId === patient.id}
              onToggleExpand={handleToggleExpand}
              onRoutineToggle={handleRoutineToggle}
              onAddRoutine={handleAddRoutine}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <AddPatientModal
        visible={patientModalVisible}
        onClose={() => setPatientModalVisible(false)}
        onSubmit={handleAddPatient}
      />

      {/* ✅ ONLY CHANGE - added patientId and patientColor props */}
      <AddRoutineModal
        visible={routineModal.visible}
        patientName={routineModal.patientName}
        patientId={routineModal.patientId || ''}
        patientColor={
          patients.find(p => p.id === routineModal.patientId)?.avatarColor || '#4F8EF7'
        }
        onClose={() => setRoutineModal({ visible: false, patientId: null, patientName: '' })}
        onSubmit={handleRoutineSubmit}
      />
    </View>
  );
}
