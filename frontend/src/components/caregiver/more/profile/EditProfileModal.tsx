import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  ActivityIndicator, TextInput, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../../constants/colors';
import { CaregiverProfile } from '../../../../types/caregiver.types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface EditProfileModalProps {
  visible: boolean;
  profile: CaregiverProfile;
  onClose: () => void;
  onSave: (updated: Partial<CaregiverProfile> & { profileImage?: string }) => void;
}

// ── Inline field component ────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  icon: keyof typeof Ionicons.glyphMap;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default', icon,
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{
      fontSize: 11, fontWeight: '700', color: Colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
    }}>
      {label}
    </Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.background,
      borderRadius: 14, paddingHorizontal: 14,
      borderWidth: 1.5, borderColor: Colors.border,
    }}>
      <Ionicons name={icon} size={16} color={Colors.textMuted} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        style={{
          flex: 1, paddingVertical: 12,
          fontSize: 14, color: Colors.textPrimary,
        }}
      />
    </View>
  </View>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible, profile, onClose, onSave,
}) => {
  const [name, setName]           = useState(profile.name);
  const [role, setRole]           = useState(profile.role);
  const [email, setEmail]         = useState(profile.email);
  const [profileImage, setProfileImage] = useState<string | null>(
    (profile as any).profileImage ?? null,
  );
  const [loading, setLoading]     = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Image picker ────────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    // Ask permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to upload a profile picture.',
        [{ text: 'OK' }],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],       // ← square crop
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access in Settings to take a profile photo.',
        [{ text: 'OK' }],
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Show action sheet style options
  const handleImagePress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how to update your photo',
      [
        { text: 'Choose from Library', onPress: handlePickImage },
        { text: 'Take a Photo',        onPress: handleTakePhoto },
        profileImage
          ? { text: 'Remove Photo', style: 'destructive', onPress: () => setProfileImage(null) }
          : null,
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any[],
    );
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    onSave({
      name:         name.trim(),
      role:         role.trim(),
      email:        email.trim(),
      initials,
      profileImage: profileImage ?? undefined,
    });
    setLoading(false);
    onClose();
  };

  const handleClose = () => {
    // Reset to profile values on cancel
    setName(profile.name);
    setRole(profile.role);
    setEmail(profile.email);
    setProfileImage((profile as any).profileImage ?? null);
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                height: '92%',
                backgroundColor: Colors.white,
                borderTopLeftRadius: 28, borderTopRightRadius: 28,
                overflow: 'hidden',
              }}
            >
              {/* Handle */}
              <View style={{
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: Colors.border, alignSelf: 'center',
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
                  <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
                    Edit Profile
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                    Update your personal details
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
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView
                  contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* ── Profile Photo Section ── */}
                  <View style={{ alignItems: 'center', marginBottom: 28 }}>

                    {/* Avatar / photo */}
                    <TouchableOpacity
                      onPress={handleImagePress}
                      activeOpacity={0.85}
                      style={{ marginBottom: 12 }}
                    >
                      <View style={{ position: 'relative' }}>
                        {profileImage ? (
                          <Image
                            source={{ uri: profileImage }}
                            style={{
                              width: 96, height: 96, borderRadius: 28,
                              borderWidth: 3, borderColor: Colors.primary,
                            }}
                          />
                        ) : (
                          <View style={{
                            width: 96, height: 96, borderRadius: 28,
                            backgroundColor: Colors.primaryLight,
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 3, borderColor: Colors.primary,
                          }}>
                            <Text style={{
                              fontSize: 34, fontWeight: '900', color: Colors.primary,
                            }}>
                              {initials || 'SJ'}
                            </Text>
                          </View>
                        )}

                        {/* Camera badge */}
                        <View style={{
                          position: 'absolute', bottom: -4, right: -4,
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: Colors.primary,
                          alignItems: 'center', justifyContent: 'center',
                          borderWidth: 2.5, borderColor: Colors.white,
                          shadowColor: Colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                        }}>
                          <Ionicons name="camera" size={14} color={Colors.white} />
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Upload options */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={handlePickImage}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 14, paddingVertical: 8,
                          borderRadius: 20, backgroundColor: Colors.primaryLight,
                          borderWidth: 1.5, borderColor: Colors.primary + '40',
                        }}
                      >
                        <Ionicons name="images-outline" size={15} color={Colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                          Gallery
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleTakePhoto}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 14, paddingVertical: 8,
                          borderRadius: 20, backgroundColor: Colors.primaryLight,
                          borderWidth: 1.5, borderColor: Colors.primary + '40',
                        }}
                      >
                        <Ionicons name="camera-outline" size={15} color={Colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary }}>
                          Camera
                        </Text>
                      </TouchableOpacity>

                      {profileImage && (
                        <TouchableOpacity
                          onPress={() => setProfileImage(null)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            paddingHorizontal: 14, paddingVertical: 8,
                            borderRadius: 20, backgroundColor: Colors.dangerSoft,
                            borderWidth: 1.5, borderColor: Colors.danger + '40',
                          }}
                        >
                          <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.danger }}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 8 }}>
                      Tap avatar or use buttons to change photo
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: Colors.borderLight, marginBottom: 20 }} />

                  {/* ── Form Fields ── */}
                  <Text style={{
                    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
                  }}>
                    Personal Information
                  </Text>

                  <Field
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Sarah Jenkins"
                    icon="person-outline"
                  />

                  <Field
                    label="Role"
                    value={role}
                    onChangeText={setRole}
                    placeholder="e.g. Lead Caregiver"
                    icon="briefcase-outline"
                  />

                  <Field
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. sarah@memocare.com"
                    keyboardType="email-address"
                    icon="mail-outline"
                  />

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: Colors.borderLight, marginVertical: 8 }} />

                  {/* Save button */}
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                      height: 52, borderRadius: 16, marginTop: 12,
                      backgroundColor: loading ? Colors.primaryLight : Colors.primary,
                      alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 8,
                      shadowColor: Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: loading ? 0 : 0.3,
                      shadowRadius: 8, elevation: loading ? 0 : 4,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                        <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 15 }}>
                          Save Changes
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