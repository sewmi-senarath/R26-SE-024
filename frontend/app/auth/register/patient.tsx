// import { registerUser } from '@/src/api/authApi';
// import { useRouter } from 'expo-router';
// import { useState } from 'react';
// import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// export default function PatientRegister() {
//   const router = useRouter();
//   const [fullName, setFullName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleRegister = async () => {
//     if (!fullName || !email || !password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill all fields'); return;
//     }
//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match'); return;
//     }
//     if (password.length < 6) {
//       Alert.alert('Error', 'Password must be at least 6 characters'); return;
//     }
//     setLoading(true);
//     try {
//       const result = await registerUser(fullName, email, password, 'patient');
//       if (result.success) {
//         Alert.alert('Success', 'Account created!', [
//           { text: 'OK', onPress: () => router.replace('/auth/login') }
//         ]);
//       } else {
//         Alert.alert('Error', result.message);
//       }
//     } catch {
//       Alert.alert('Error', 'Cannot connect to server.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
      
//       {/* Back */}
//       <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
//         <Text style={{ color: '#6b7280', fontSize: 16 }}>← Back</Text>
//       </TouchableOpacity>

//       {/* Header */}
//       <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>Patient Register</Text>
//       <Text style={{ color: '#6b7280', marginBottom: 32 }}>Create your account to get started</Text>

//       {/* Fields */}
//       {[
//         { label: 'Full Name', placeholder: 'Enter your full name', value: fullName, setter: setFullName, keyboard: 'default', secure: false },
//         { label: 'Email', placeholder: 'Enter your email', value: email, setter: setEmail, keyboard: 'email-address', secure: false },
//         { label: 'Password', placeholder: 'Create a password', value: password, setter: setPassword, keyboard: 'default', secure: true },
//         { label: 'Confirm Password', placeholder: 'Confirm your password', value: confirmPassword, setter: setConfirmPassword, keyboard: 'default', secure: true },
//       ].map((field) => (
//         <View key={field.label}>
//           <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>{field.label}</Text>
//           <TextInput
//             style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 }}
//             placeholder={field.placeholder}
//             value={field.value}
//             onChangeText={field.setter}
//             keyboardType={field.keyboard as any}
//             secureTextEntry={field.secure}
//             autoCapitalize="none"
//           />
//         </View>
//       ))}

//       {/* Register Button */}
//       <TouchableOpacity
//         onPress={handleRegister}
//         disabled={loading}
//         style={{ backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 16 }}
//       >
//         {loading
//           ? <ActivityIndicator color="white" />
//           : <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Create Account</Text>
//         }
//       </TouchableOpacity>

//       {/* Login Link */}
//       <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
//         <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
//         <TouchableOpacity onPress={() => router.push('/auth/login')}>
//           <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Login</Text>
//         </TouchableOpacity>
//       </View>

//     </ScrollView>
//   );
// }

import { registerUser } from '@/src/api/authApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Reusable Dropdown Component ──────────────────────────
interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  placeholder: string;
  required?: boolean;
}

function Dropdown({ label, value, options, onSelect, placeholder, required }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>
        {label}{required ? ' *' : ''}
      </Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
          paddingHorizontal: 16, paddingVertical: 13,
          backgroundColor: 'white', flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 15, color: value ? '#1f2937' : '#9ca3af' }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6b7280" />
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              {label}
            </Text>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option}
                onPress={() => { onSelect(option); setOpen(false); }}
                style={{
                  paddingHorizontal: 20, paddingVertical: 14,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: value === option ? '#EFF6FF' : 'white',
                  borderBottomWidth: index !== options.length - 1 ? 1 : 0,
                  borderBottomColor: '#f3f4f6',
                }}
              >
                <Text style={{ fontSize: 15, color: value === option ? '#2563eb' : '#374151', fontWeight: value === option ? '600' : '400' }}>
                  {option}
                </Text>
                {value === option && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────
export default function PatientRegister() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [cognitiveLevel, setCognitiveLevel] = useState('');
  const [hometown, setHometown] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!gender) {
      Alert.alert('Error', 'Please select gender');
      return;
    }
    if (!preferredLanguage) {
      Alert.alert('Error', 'Please select preferred language');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(fullName, email, password, 'patient');
      if (result.success) {
        Alert.alert('Success', 'Patient profile created!', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#EFF6FF' }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: '#EFF6FF',
        paddingTop: 52, paddingHorizontal: 24, paddingBottom: 20,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937' }}>
          Register Patient
        </Text>
        <Text style={{ color: '#6b7280', marginTop: 4 }}>
          Create a patient profile
        </Text>
      </View>

      <View style={{
        marginHorizontal: 16, backgroundColor: 'white',
        borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>

        {/* Full Name */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Full Name *</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
          placeholder="Enter patient's name"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Email */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Email *</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
          placeholder="Enter email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Password *</Text>
        <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#f9fafb' }}>
          <TextInput
            style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 14 }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Confirm Password *</Text>
        <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#f9fafb' }}>
          <TextInput
            style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 }}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ paddingHorizontal: 14 }}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Age + Gender Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Age *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Gender"
              value={gender}
              options={['Male', 'Female', 'Other']}
              onSelect={setGender}
              placeholder="Select"
              required
            />
          </View>
        </View>

        {/* Preferred Language */}
        <Dropdown
          label="Preferred Language"
          value={preferredLanguage}
          options={['English', 'Sinhala', 'Tamil', 'Other']}
          onSelect={setPreferredLanguage}
          placeholder="Select language"
          required
        />

        {/* Cognitive Level */}
        <Dropdown
          label="Cognitive Level (Optional)"
          value={cognitiveLevel}
          options={['Mild', 'Moderate', 'Severe']}
          onSelect={setCognitiveLevel}
          placeholder="Select level"
        />

        {/* Hometown */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Hometown</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
          placeholder="Where are they from?"
          value={hometown}
          onChangeText={setHometown}
        />

        {/* Family Members */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Family Members</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
          placeholder="e.g., Daughter Sarah, Son Michael"
          value={familyMembers}
          onChangeText={setFamilyMembers}
        />

        {/* Hobbies */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Hobbies</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' }}
          placeholder="e.g., Gardening, Reading"
          value={hobbies}
          onChangeText={setHobbies}
        />

        {/* Interests */}
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Interests</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 24, backgroundColor: '#f9fafb' }}
          placeholder="e.g., Music, Art, Nature"
          value={interests}
          onChangeText={setInterests}
        />

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: '#2563eb', paddingVertical: 16,
            borderRadius: 12, alignItems: 'center', marginBottom: 16,
            shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
          }}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold' }}>Create Patient Profile</Text>
          }
        </TouchableOpacity>

        {/* Login Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}